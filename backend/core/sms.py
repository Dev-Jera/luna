import json
import logging
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from .models import PhoneCode

logger = logging.getLogger(__name__)


def normalize_phone(value):
    phone = ''.join(ch for ch in str(value).strip() if ch.isdigit() or ch == '+')
    if phone.startswith('00'):
        phone = '+' + phone[2:]
    if not phone.startswith('+') or not phone[1:].isdigit() or not 8 <= len(phone[1:]) <= 15:
        raise ValueError('Use international format, for example +254712345678.')
    return phone


class AfricasTalkingSMS:
    def __init__(self):
        self.username = settings.AFRICASTALKING_USERNAME
        self.api_key = settings.AFRICASTALKING_API_KEY
        self.sender_id = settings.AFRICASTALKING_SENDER_ID
        self.last_error = ''
        env_url = getattr(settings, 'AFRICASTALKING_SMS_URL', '')
        if env_url and 'sandbox' not in env_url and self.username.lower() == 'sandbox':
            self.base_url = 'https://api.sandbox.africastalking.com/version1/messaging'
        elif env_url and 'sandbox' in env_url and self.username.lower() != 'sandbox':
            self.base_url = 'https://api.africastalking.com/version1/messaging'
        else:
            self.base_url = env_url or ('https://api.sandbox.africastalking.com/version1/messaging' if self.username.lower() == 'sandbox' else 'https://api.africastalking.com/version1/messaging')

    @property
    def configured(self):
        return bool(self.username and self.api_key)

    def send(self, phone, message):
        self.last_error = ''
        if not self.configured:
            self.last_error = 'Africa\'s Talking credentials are missing.'
            logger.info('SMS skipped because Africa\'s Talking is not configured')
            return False
        payload = {'username': self.username, 'to': phone, 'message': message}
        if self.sender_id:
            payload['from'] = self.sender_id
        headers = {
            'apiKey': self.api_key,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        try:
            import requests
            response = requests.post(self.base_url, headers=headers, data=payload, timeout=settings.AFRICASTALKING_TIMEOUT)
            if response.status_code == 201:
                result = response.json()
                message_data = result.get('SMSMessageData', {})
                recipients = message_data.get('Recipients', [])
                if recipients and str(recipients[0].get('status', '')).lower() == 'success':
                    return True
                recipient = recipients[0] if recipients else {}
                provider_status = str(recipient.get('status') or message_data.get('Message') or 'Unknown provider response')
                status_code = recipient.get('statusCode')
                self.last_error = f'{provider_status} (code {status_code})' if status_code is not None else provider_status
                logger.warning('Africa\'s Talking rejected SMS: %s', self.last_error)
                return False
            else:
                try:
                    provider_message = response.json().get('errorMessage') or response.json().get('description') or response.text
                except Exception:
                    provider_message = response.text
                self.last_error = f'HTTP {response.status_code}: {str(provider_message)[:200]}'
                logger.warning('Africa\'s Talking SMS failed with status %d: %s', response.status_code, response.text)
                return False
        except Exception as exc:
            self.last_error = str(exc)[:200]
            logger.warning('Africa\'s Talking SMS failed: %s', exc)
            return False


def issue_code(profile, purpose):
    PhoneCode.objects.filter(profile=profile, purpose=purpose, used_at__isnull=True).update(used_at=timezone.now())
    code = f'{secrets.randbelow(1_000_000):06d}'
    PhoneCode.objects.create(profile=profile, purpose=purpose, code_hash=make_password(code), expires_at=timezone.now() + timedelta(minutes=10))
    return code


def consume_code(profile, purpose, code):
    record = PhoneCode.objects.filter(profile=profile, purpose=purpose, used_at__isnull=True).first()
    if not record or not record.usable:
        return False
    record.attempts += 1
    valid = check_password(str(code), record.code_hash)
    if valid:
        record.used_at = timezone.now()
    record.save(update_fields=['attempts', 'used_at'])
    return valid


def send_code(profile, purpose):
    code = issue_code(profile, purpose)
    label = 'verification' if purpose == 'verify' else 'password reset'
    return AfricasTalkingSMS().send(profile.phone_number, f'Your Luna {label} code is {code}. It expires in 10 minutes. Do not share it.')
