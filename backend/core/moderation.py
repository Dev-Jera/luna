import re
from .models import ModerationEvent

PATTERNS={'threat':re.compile(r'\b(kill|hurt|attack)\s+(you|them|him|her)\b',re.I),'spam':re.compile(r'(https?://\S+\s*){3,}',re.I)}
def inspect_message(message):
 categories=[name for name,pattern in PATTERNS.items() if pattern.search(message.body)]
 if categories:return ModerationEvent.objects.create(message=message,categories=categories,severity='urgent' if 'threat' in categories else 'review')
 return None
