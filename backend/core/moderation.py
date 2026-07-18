import re
from .models import ModerationEvent

PATTERNS = {
    'threat': re.compile(r'\b(kill|hurt|attack)\s+(you|them|him|her)\b', re.I),
    'spam': re.compile(r'(https?://\S+\s*){3,}', re.I),
    'prostitution': re.compile(r'\b(hookup\s+price|cash\s+for\s+sex|hookups|sex\s+work|price\s+for\s+sex|night\s+stand|per\s+hour|night\s+rate|escort\s+rate|escorts|nudes\s+rate)\b', re.I),
    'begging': re.compile(r'\b(send\s+momo|send\s+money|need\s+financial\s+help|give\s+me\s+cash|send\s+me\s+momo|momo\s+me|send\s+cash|need\s+money|borrow\s+money)\b', re.I),
    'sales': re.compile(r'\b(sell\s+photos|sell\s+nudes|buy\s+product|onlyfans|commercial\s+sex|paid\s+sex|buy\s+my\s+pics|selling\s+pics)\b', re.I),
    'scam_theft': re.compile(r'\b(bank\s+login|send\s+otp|card\s+pin|card\s+details|otp\s+code)\b', re.I),
}

def inspect_message(message):
 categories=[name for name,pattern in PATTERNS.items() if pattern.search(message.body)]
 if categories:
  event = ModerationEvent.objects.create(message=message,categories=categories,severity='urgent' if 'threat' in categories else 'review')
  
  if message.sender and not message.sender.is_staff:
   user = message.sender
   user.is_active = False
   user.save(update_fields=['is_active'])
   
   from .models import AuditEvent, Report, Profile
   from django.contrib.auth.models import User
   
   system_user, _ = User.objects.get_or_create(
    username='system_moderation', 
    defaults={'email': 'moderation@luna.app', 'is_active': False}
   )
   system_profile, _ = Profile.objects.get_or_create(
    user=system_user, 
    defaults={'display_name': 'System Moderation', 'onboarding_complete': True}
   )
   
   Report.objects.create(
    reporter=system_profile,
    reported=user.profile,
    conversation=message.conversation,
    reason='other',
    details=f"[AUTO-MODERATION] Suspended user for violating meaningful connection policy.\nCategories: {', '.join(categories)}\nMessage: \"{message.body}\""
   )
   
   AuditEvent.objects.create(
    actor=system_profile,
    event='profile.suspended',
    target_type='profile',
    target_id=user.profile.id,
    metadata={'categories': categories, 'message': message.body[:200]}
   )
   
  return event
 return None

