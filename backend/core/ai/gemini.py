import json
import urllib.error
import urllib.request

from django.conf import settings


class GeminiError(RuntimeError):
    pass


class GeminiProvider:
    """Minimal adapter for Gemini's REST generateContent API."""

    def __init__(self, api_key=None, base_url=None, model=None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.base_url = (base_url or settings.GEMINI_BASE_URL).rstrip('/')
        self.model = model or settings.GEMINI_MODEL

    @property
    def configured(self):
        return bool(self.api_key)

    def structured(self, system, user, schema_name='luna_response'):
        if not self.configured:
            raise GeminiError('Gemini is not configured')
        payload = {
            'systemInstruction': {'parts': [{'text': system}]},
            'contents': [{'role': 'user', 'parts': [{'text': user}]}],
            'generationConfig': {
                'temperature': 0.3,
                'maxOutputTokens': 2048,
                'responseMimeType': 'application/json',
            },
        }
        request = urllib.request.Request(
            f'{self.base_url}/models/{self.model}:generateContent',
            data=json.dumps(payload).encode(),
            headers={'x-goog-api-key': self.api_key, 'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(request, timeout=settings.GEMINI_TIMEOUT) as response:
                data = json.loads(response.read())
            content = data['candidates'][0]['content']['parts'][0]['text']
            return json.loads(content)
        except (urllib.error.URLError, urllib.error.HTTPError, KeyError, ValueError, json.JSONDecodeError) as exc:
            raise GeminiError(f'Gemini request failed: {exc}') from exc

    def embed(self, text):
        if not self.configured:
            raise GeminiError('Gemini is not configured')
        payload = {
            'content': {'parts': [{'text': text}]}
        }
        # Use standard embedding model text-embedding-004
        request = urllib.request.Request(
            f'{self.base_url}/models/text-embedding-004:embedContent',
            data=json.dumps(payload).encode(),
            headers={'x-goog-api-key': self.api_key, 'Content-Type': 'application/json'},
            method='POST',
        )
        try:
            with urllib.request.urlopen(request, timeout=settings.GEMINI_TIMEOUT) as response:
                data = json.loads(response.read())
            return data['embedding']['values']
        except (urllib.error.URLError, urllib.error.HTTPError, KeyError, ValueError, json.JSONDecodeError) as exc:
            raise GeminiError(f'Gemini embedding failed: {exc}') from exc

