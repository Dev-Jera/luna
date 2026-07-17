import json
from datetime import timedelta
from celery import shared_task
from .ai import GeminiProvider
from .ai.prompts import INTRO_SYSTEM,MATCH_SYSTEM,PROFILE_SYSTEM,WELCOME_SYSTEM
from django.utils import timezone
from .models import Conversation,IntroductionDraft,Match,Message,Notification,Profile
from .sms import AfricasTalkingSMS
from .services import compatibility

def profile_payload(profile):
 return {'display_name':profile.display_name,'bio':profile.bio,'connection_goal':profile.connection_goal,'values':profile.values,'interests':profile.interests,'communication_style':profile.communication_style,'life_goals':profile.life_goals,'lifestyle':profile.lifestyle,'deal_breakers':profile.deal_breakers}

def cosine_similarity(v1,v2):
 if not v1 or not v2 or len(v1)!=len(v2):return 0.0
 dot_product=sum(a*b for a,b in zip(v1,v2))
 mag_a=sum(a*a for a in v1)**0.5
 mag_b=sum(b*b for b in v2)**0.5
 return dot_product/(mag_a*mag_b) if mag_a and mag_b else 0.0

@shared_task
def refresh_matches(profile_id):
 p=Profile.objects.get(pk=profile_id)
 if not (p.onboarding_complete and p.is_discoverable):return 0
 blocked_ids=set(p.blocks_made.values_list('blocked_id',flat=True))|set(p.blocks_received.values_list('blocker_id',flat=True))
 candidates=Profile.objects.exclude(pk=profile_id).exclude(pk__in=blocked_ids).filter(onboarding_complete=True,is_discoverable=True)
 candidates=candidates.filter(connection_goal=p.connection_goal)
 if p.connection_goal=='romance':
  from django.db.models import Q
  if p.gender_preference!='both':candidates=candidates.filter(gender=p.gender_preference)
  if p.gender!='male':candidates=candidates.exclude(gender_preference='male')
  if p.gender!='female':candidates=candidates.exclude(gender_preference='female')
 for candidate in candidates:
  if p.ai_embedding and candidate.ai_embedding:
   sim=cosine_similarity(p.ai_embedding,candidate.ai_embedding)
   score=max(0,min(99,int(sim*100)))
   shared_interests=list(set(p.interests)&set(candidate.interests))
   reasons=[f"Shared interests: {', '.join(shared_interests[:3])}"] if shared_interests else ["Highly aligned profile values"]
  else:
   score,reasons=compatibility(p,candidate)
  if score >= 70:
   Match.objects.update_or_create(requester=p,candidate=candidate,defaults={'score':score,'reasons':reasons})
  else:
   Match.objects.filter(requester=p,candidate=candidate,status='suggested').delete()
  
  if candidate.ai_embedding and p.ai_embedding:
   sim=cosine_similarity(candidate.ai_embedding,p.ai_embedding)
   rev_score=max(0,min(99,int(sim*100)))
   shared_interests=list(set(p.interests)&set(candidate.interests))
   rev_reasons=[f"Shared interests: {', '.join(shared_interests[:3])}"] if shared_interests else ["Highly aligned profile values"]
  else:
   rev_score,rev_reasons=compatibility(candidate,p)
  if rev_score >= 70:
   Match.objects.update_or_create(requester=candidate,candidate=p,defaults={'score':rev_score,'reasons':rev_reasons})
  else:
   Match.objects.filter(requester=candidate,candidate=p,status='suggested').delete()
 for owner in [p,*list(candidates)]:
  inbox=Conversation.objects.filter(is_luna=True,participants=owner).first();pending=Match.objects.filter(requester=owner,status='suggested',presented_at__isnull=True,candidate__onboarding_complete=True,candidate__is_discoverable=True).order_by('-score').first()
  if inbox and pending and not inbox.pending_match_id:
   inbox.pending_match=pending;inbox.luna_stage='offered';inbox.save(update_fields=['pending_match','luna_stage']);pending.presented_at=__import__('django.utils.timezone',fromlist=['now']).now();pending.save(update_fields=['presented_at']);Message.objects.create(conversation=inbox,is_ai=True,body='Hey — I found a profile that may align well with yours. Would you like me to show it to you so we can talk it through first?')
   try:
    sms=AfricasTalkingSMS()
    sms.send(owner.phone_number, f"Hi {owner.display_name}, Luna here! I have found a potential match for you. Come online on the Luna app to discuss.")
   except Exception:
    pass
 return Match.objects.filter(requester=p).count()

@shared_task
def send_unread_sms_reminders():
 cutoff=timezone.now()-timedelta(minutes=30);sent=0;sms=AfricasTalkingSMS()
 for notification in Notification.objects.select_related('profile').filter(kind='message',read_at__isnull=True,sms_sent_at__isnull=True,created_at__lte=cutoff,profile__phone_verified=True,profile__sms_unread_reminders=True):
  if sms.send(notification.profile.phone_number,'You have an unread notification in Luna. Open the app to view it.'):
   notification.sms_sent_at=timezone.now();notification.save(update_fields=['sms_sent_at']);sent+=1
 return sent

@shared_task(bind=True,max_retries=2,default_retry_delay=5)
def analyze_profile(self,profile_id):
 profile=Profile.objects.get(pk=profile_id)
 if not profile.ai_profile_consent:return 'consent_revoked'
 profile.ai_analysis_status='processing';profile.save(update_fields=['ai_analysis_status'])
 try:
  provider=GeminiProvider()
  if provider.configured:
   data=provider.structured(PROFILE_SYSTEM,json.dumps(profile_payload(profile)))
   try:
    profile.ai_embedding=provider.embed(data.get('summary',''))
   except Exception:
    pass
  else:data={'summary':f"{profile.display_name} values {', '.join(profile.values[:2])} and enjoys {', '.join(profile.interests[:2])}.",'traits':profile.values[:3] or ['Open to connection']}
  profile.ai_summary=str(data.get('summary',''))[:1000];profile.ai_traits=[str(x)[:80] for x in data.get('traits',[])[:5]];profile.ai_analysis_status='complete';profile.save(update_fields=['ai_summary','ai_traits','ai_analysis_status','ai_embedding']);refresh_matches(profile.id);return 'complete'
 except Exception as exc:
  if self.request.retries<self.max_retries:raise self.retry(exc=exc)
  profile.ai_analysis_status='failed';profile.save(update_fields=['ai_analysis_status']);return 'failed'

@shared_task(bind=True,max_retries=2,default_retry_delay=5)
def enrich_match(self,match_id):
 match=Match.objects.select_related('requester','candidate').get(pk=match_id)
 if not (match.requester.ai_profile_consent and match.candidate.ai_profile_consent):return 'consent_required'
 try:
  provider=GeminiProvider()
  if not provider.configured:
   match.ai_explanation='You share meaningful points of alignment while still bringing different perspectives to the connection.';match.save(update_fields=['ai_explanation']);return 'fallback'
  data=provider.structured(MATCH_SYSTEM,json.dumps({'person_a':profile_payload(match.requester),'person_b':profile_payload(match.candidate),'deterministic_score':match.score,'existing_reasons':match.reasons}))
  adjustment=max(-5,min(5,int(data.get('score_adjustment',0))));match.score=max(0,min(99,match.score+adjustment));match.ai_explanation=str(data.get('explanation',''))[:1200];new_reasons=[str(x)[:120] for x in data.get('reasons',[])[:4]];match.reasons=new_reasons or match.reasons;match.save(update_fields=['score','ai_explanation','reasons']);return 'complete'
 except Exception as exc:
  if self.request.retries<self.max_retries:raise self.retry(exc=exc)
  return 'failed'

@shared_task(bind=True,max_retries=2,default_retry_delay=5)
def generate_introduction(self,draft_id):
 draft=IntroductionDraft.objects.select_related('conversation','requested_by').prefetch_related('conversation__participants').get(pk=draft_id)
 if not draft.conversation.ai_enabled:draft.status='failed';draft.save(update_fields=['status']);return 'consent_required'
 participants=list(draft.conversation.participants.all())
 try:
  provider=GeminiProvider()
  if provider.configured:data=provider.structured(INTRO_SYSTEM,json.dumps({'participants':[profile_payload(p) for p in participants]}));body=str(data.get('draft',''))
  else:
   shared=set(participants[0].interests) & set(participants[1].interests) if len(participants)>1 else set();topic=next(iter(shared),'what brought each of you to Luna');body=f"You both chose to connect. A natural place to begin might be {topic}."
  draft.body=body[:1200];draft.status='draft';draft.save(update_fields=['body','status']);return 'complete'
 except Exception as exc:
  if self.request.retries<self.max_retries:raise self.retry(exc=exc)
  draft.status='failed';draft.save(update_fields=['status']);return 'failed'

@shared_task(bind=True,max_retries=2,default_retry_delay=5)
def generate_welcome_message(self,profile_id,conversation_id):
 try:
  profile=Profile.objects.get(pk=profile_id)
  conversation=Conversation.objects.get(pk=conversation_id)
 except (Profile.DoesNotExist,Conversation.DoesNotExist):
  return 'not_found'
 if conversation.messages.filter(is_ai=True).exists():
  return 'already_welcomed'
 try:
  provider=GeminiProvider()
  if provider.configured:
   data=provider.structured(WELCOME_SYSTEM,json.dumps({'display_name':profile.display_name}))
   body=str(data.get('reply','')).strip()
   if not body:raise ValueError('Gemini returned empty reply')
  else:
   body=f"Welcome to Luna, {profile.display_name}. I’ll privately bring you one thoughtful match at a time and always ask before showing a profile or making an introduction."
 except Exception as exc:
  body=f"Welcome to Luna, {profile.display_name}. I’ll privately bring you one thoughtful match at a time and always ask before showing a profile or making an introduction."
  if self.request.retries<self.max_retries:raise self.retry(exc=exc)
 message=Message.objects.create(conversation=conversation,is_ai=True,body=body)
 try:
  from asgiref.sync import async_to_sync
  from channels.layers import get_channel_layer
  from .serializers import MessageSerializer
  channel_layer=get_channel_layer()
  if channel_layer:
   data=MessageSerializer(message).data
   async_to_sync(channel_layer.group_send)(f'chat_{conversation.id}',{'type':'chat.message','message':data})
 except Exception:
  pass
 return 'complete'

@shared_task
def extract_profile_insights(profile_id, message_body):
 try:
  profile = Profile.objects.get(pk=profile_id)
 except Profile.DoesNotExist:
  return 'not_found'
 provider = GeminiProvider()
 if not provider.configured:
  return 'not_configured'
 system_prompt = (
  "You are Luna, a relationship psychology assistant. "
  "Analyze the user's message below to identify new relationship habits, core values, "
  "interests, lifestyle preferences, or deal-breakers. "
  "Return a JSON object with any changes or additions to update the user's profile: "
  "{\n"
  "  \"values\": [\"list of values to add\"],\n"
  "  \"interests\": [\"list of interests to add\"],\n"
  "  \"lifestyle\": [\"list of lifestyle details to add\"],\n"
  "  \"deal_breakers\": [\"list of deal-breakers to add\"]\n"
  "}\n"
  "Only output details directly supported by the text. If nothing is found, return empty lists."
 )
 try:
  data = provider.structured(system_prompt, message_body)
  updated = False
  for key in ['values', 'interests', 'lifestyle', 'deal_breakers']:
   items_to_add = data.get(key, [])
   if items_to_add and isinstance(items_to_add, list):
    current_list = getattr(profile, key, [])
    if not isinstance(current_list, list):
     current_list = []
    for item in items_to_add:
     item_clean = str(item).strip()
     if item_clean and item_clean.lower() not in [x.lower() for x in current_list]:
      current_list.append(item_clean)
      updated = True
    setattr(profile, key, current_list)
  if updated:
   profile.save()
   # Run profile summary update in background
   analyze_profile.delay(profile.id)
   return 'updated'
 except Exception:
  return 'failed'
 return 'no_change'
