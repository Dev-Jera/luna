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
  if score >= 40:
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
  if rev_score >= 40:
   Match.objects.update_or_create(requester=candidate,candidate=p,defaults={'score':rev_score,'reasons':rev_reasons})
  else:
   Match.objects.filter(requester=candidate,candidate=p,status='suggested').delete()
 for owner in [p,*list(candidates)]:
  inbox=Conversation.objects.filter(is_luna=True,participants=owner).first();pending=Match.objects.filter(requester=owner,status='suggested',presented_at__isnull=True,candidate__onboarding_complete=True,candidate__is_discoverable=True).order_by('-score').first()
  if inbox and pending and not inbox.pending_match_id:
   today = timezone.now().date()
   daily_count = Match.objects.filter(requester=owner, presented_at__date=today).count()
   should_present = False
   is_premium_locked = False
   if owner.is_premium:
    should_present = True
   else:
    if daily_count < 2:
     should_present = True
    elif pending.score >= 90:
     should_present = True
     is_premium_locked = True
   if should_present:
    inbox.pending_match=pending
    pending.presented_at=timezone.now()
    pending.save(update_fields=['presented_at'])
    if is_premium_locked:
     inbox.luna_stage='premium_locked'
     inbox.save(update_fields=['pending_match','luna_stage'])
     Message.objects.create(
      conversation=inbox,
      is_ai=True,
      body=f"Hey — I found a highly compatible {pending.score}% match for you! However, you've reached your limit of 2 daily free matches. Click below to upgrade to Premium to unlock this profile!",
      metadata={'type': 'profile_locked_premium', 'score': pending.score}
     )
    else:
     inbox.luna_stage='offered'
     inbox.save(update_fields=['pending_match','luna_stage'])
     Message.objects.create(conversation=inbox,is_ai=True,body='Hey — I found a profile that may align well with yours. Would you like me to show it to you so we can talk it through first?')
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

@shared_task
def process_nylon_payment(profile_id, phone_number, amount, reference):
    import sys
    import logging
    from django.conf import settings
    from .models import Profile, PremiumPayment, Conversation, Message

    task_logger = logging.getLogger(__name__)
    payment_record = PremiumPayment.objects.filter(reference=reference).first()
    if not payment_record:
        return 'not_found'

    is_mock = (
        'test' in sys.argv or 
        settings.NYLONPAY_API_KEY == 'npk_test_luna_sandbox' or 
        not settings.NYLONPAY_API_KEY
    )

    if is_mock:
        payment_record.status = 'processing'
        payment_record.save(update_fields=['status'])
        if str(phone_number).endswith('0'):
            payment_record.status = 'failed'
        else:
            payment_record.status = 'successful'
            profile = Profile.objects.get(id=profile_id)
            profile.is_premium = True
            profile.save(update_fields=['is_premium'])
            
            inbox = Conversation.objects.filter(is_luna=True, participants=profile).first()
            if inbox and inbox.luna_stage == 'premium_locked':
                inbox.luna_stage = 'offered'
                inbox.save(update_fields=['luna_stage'])
                Message.objects.create(
                    conversation=inbox,
                    is_ai=True,
                    body="Congratulations! Your account is now Premium. I've unlocked your 90%+ compatibility match suggestion! Would you like me to show it to you so we can talk it through?"
                )
        payment_record.save(update_fields=['status'])
        return payment_record.status

    from nylonpay import create_nylon_pay
    nylonpay = create_nylon_pay(
        api_key=settings.NYLONPAY_API_KEY,
        api_secret=settings.NYLONPAY_API_SECRET
    )

    try:
        payment_record.status = 'processing'
        payment_record.save(update_fields=['status'])

        profile = Profile.objects.get(id=profile_id)
        
        payment = nylonpay.collect_payment(
            amount=amount,
            currency=payment_record.currency,
            customer={
                "name": profile.display_name or profile.user.username,
                "phone_number": phone_number,
            },
            description="Luna Premium Upgrade",
            reference=str(reference),
        )

        tx = payment.wait()
        
        if tx and tx.status == 'successful':
            payment_record.status = 'successful'
            profile.is_premium = True
            profile.save(update_fields=['is_premium'])
            
            inbox = Conversation.objects.filter(is_luna=True, participants=profile).first()
            if inbox and inbox.luna_stage == 'premium_locked':
                inbox.luna_stage = 'offered'
                inbox.save(update_fields=['luna_stage'])
                Message.objects.create(
                    conversation=inbox,
                    is_ai=True,
                    body="Congratulations! Your account is now Premium. I've unlocked your 90%+ compatibility match suggestion! Would you like me to show it to you so we can talk it through?"
                )
        else:
            payment_record.status = 'failed'
            
        payment_record.save(update_fields=['status'])
        return payment_record.status

    except Exception as e:
        task_logger.exception("Nylon Pay collection failed")
        payment_record.status = 'failed'
        payment_record.save(update_fields=['status'])
        return 'failed'


@shared_task
def update_match_board(conversation_id):
    try:
        c = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return
    if c.is_luna or c.is_counseling:
        return

    participants = list(c.participants.all())
    if len(participants) < 2:
        return
    p1, p2 = participants[0], participants[1]

    provider = GeminiProvider()
    if provider.configured:
        # Fetch last 30 messages in chronological order
        messages = c.messages.filter(is_ai=False).order_by('-created_at')[:30]
        messages = list(reversed(messages))

        history_text = ""
        for msg in messages:
            sender_name = msg.sender.profile.display_name if msg.sender and hasattr(msg.sender, 'profile') else "System"
            history_text += f"{sender_name}: {msg.body}\n"

        system_prompt = (
            "You are Luna, an AI relationship intelligence assistant. Your job is to analyze "
            "the direct chat messages between two users and compile a progress board.\n"
            "Return a JSON object with the exact keys:\n"
            "  \"progress\": \"A brief summary of how far their conversation has reached, mutual alignment, what they have talked about, or scheduling states (max 40 words).\"\n"
            "  \"summary_p1\": \"A warm, concise summary of Participant 1's profile and personality details for Participant 2 to read (max 50 words).\"\n"
            "  \"summary_p2\": \"A warm, concise summary of Participant 2's profile and personality details for Participant 1 to read (max 50 words).\"\n"
        )

        user_prompt = (
            f"Participant 1: {p1.display_name} (Bio: {p1.bio}, Interests: {p1.interests})\n"
            f"Participant 2: {p2.display_name} (Bio: {p2.bio}, Interests: {p2.interests})\n\n"
            f"Chat History:\n{history_text}\n"
        )

        try:
            res = provider.structured(system_prompt, user_prompt)
            c.luna_board = {
                'progress': res.get('progress', 'Conversation initiated. Say hello!'),
                'summaries': {
                    str(p1.id): res.get('summary_p2', ''), # summary of P2 for P1 to read
                    str(p2.id): res.get('summary_p1', ''), # summary of P1 for P2 to read
                }
            }
            c.save(update_fields=['luna_board'])
            return
        except Exception:
            pass

    # Fallback to defaults
    c.luna_board = {
        'progress': 'Conversation initiated. Start chatting to get to know each other!',
        'summaries': {
            str(p1.id): f"{p2.display_name} is located in {p2.location or 'Uganda'}. Connection goal: {p2.connection_goal}.",
            str(p2.id): f"{p1.display_name} is located in {p1.location or 'Uganda'}. Connection goal: {p1.connection_goal}."
        }
    }
    c.save(update_fields=['luna_board'])
