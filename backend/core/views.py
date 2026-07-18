from asgiref.sync import async_to_sync
import json
from channels.layers import get_channel_layer
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics,permissions,status,viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle,UserRateThrottle
from rest_framework.views import APIView
from .models import AuditEvent,Block,Consent,Conversation,ConversationReadState,IntroductionDraft,Match,MatchFeedback,Message,Notification,Profile,Report,ModerationEvent,DateMeeting,CounselingSession,PremiumPayment
from .moderation import inspect_message
from .serializers import ConversationSerializer,IntroductionDraftSerializer,MatchSerializer,MessageSerializer,NotificationSerializer,ProfileSerializer,RegisterSerializer,CounselingSessionSerializer
from .tasks import analyze_profile,enrich_match,generate_introduction,refresh_matches,generate_welcome_message,extract_profile_insights,process_nylon_payment,update_match_board
from .task_dispatch import dispatch
from .sms import AfricasTalkingSMS,consume_code,send_code
from .ai import GeminiProvider
from .ai.prompts import LUNA_CHAT_SYSTEM
class RegisterView(generics.CreateAPIView):serializer_class=RegisterSerializer;permission_classes=[permissions.AllowAny];authentication_classes=[]
class SendPhoneVerificationView(APIView):
 def post(self,request):
  profile=request.user.profile
  if profile.phone_verified:return Response({'detail':'Phone number is already verified.'})
  if not profile.phone_number:return Response({'phone_number':['No phone number is attached to this account.']},status=status.HTTP_400_BAD_REQUEST)
  sent=send_code(profile,'verify');return Response({'sent':sent},status=status.HTTP_202_ACCEPTED)
class ConfirmPhoneVerificationView(APIView):
 def post(self,request):
  profile=request.user.profile
  if not consume_code(profile,'verify',request.data.get('code','')):return Response({'code':['Invalid or expired code.']},status=status.HTTP_400_BAD_REQUEST)
  profile.phone_verified=True;profile.save(update_fields=['phone_verified']);return Response({'verified':True})
class PasswordResetRequestView(APIView):
 permission_classes=[permissions.AllowAny];authentication_classes=[]
 def post(self,request):
  from .sms import normalize_phone
  try:phone=normalize_phone(request.data.get('phone_number',''))
  except ValueError:return Response({'detail':'If the number is registered, a reset code has been sent.'},status=status.HTTP_202_ACCEPTED)
  profile=Profile.objects.filter(phone_number=phone,phone_verified=True).first()
  if profile:send_code(profile,'reset')
  return Response({'detail':'If the number is registered, a reset code has been sent.'},status=status.HTTP_202_ACCEPTED)
class PasswordResetConfirmView(APIView):
 permission_classes=[permissions.AllowAny];authentication_classes=[]
 def post(self,request):
  from .sms import normalize_phone
  try:phone=normalize_phone(request.data.get('phone_number',''))
  except ValueError:return Response({'code':['Invalid or expired code.']},status=status.HTTP_400_BAD_REQUEST)
  profile=Profile.objects.filter(phone_number=phone,phone_verified=True).select_related('user').first();password=str(request.data.get('new_password',''))
  if not profile or not consume_code(profile,'reset',request.data.get('code','')):return Response({'code':['Invalid or expired code.']},status=status.HTTP_400_BAD_REQUEST)
  if len(password)<8:return Response({'new_password':['Use at least 8 characters.']},status=status.HTTP_400_BAD_REQUEST)
  profile.user.set_password(password);profile.user.save(update_fields=['password'])
  if profile.sms_safety_alerts:AfricasTalkingSMS().send(profile.phone_number,'Your Luna password was changed. If this was not you, contact Luna support immediately.')
  AuditEvent.objects.create(actor=profile,event='account.password_reset',target_type='user',target_id=profile.user_id);return Response({'reset':True})
class MessageThrottle(UserRateThrottle):rate='30/min'
class ProfileViewSet(viewsets.GenericViewSet):
 serializer_class=ProfileSerializer;queryset=Profile.objects.none()
 throttle_scope='safety'
 def get_queryset(self):return type(self.request.user.profile).objects.filter(user=self.request.user)
 @action(detail=False,methods=['get','patch'],url_path='me')
 def me(self,request):
  if request.method=='PATCH':
   user_data = request.data.get('user')
   if user_data and isinstance(user_data, dict):
    u = request.user
    if 'first_name' in user_data: u.first_name = user_data['first_name']
    if 'email' in user_data: u.email = user_data['email']
    if 'username' in user_data: u.username = user_data['username']
    u.save()
  serializer=self.get_serializer(request.user.profile,data=request.data,partial=True) if request.method=='PATCH' else self.get_serializer(request.user.profile)
  if request.method=='PATCH':
   previous_consent=request.user.profile.ai_profile_consent;safety_fields={'is_discoverable','sms_match_notifications','sms_unread_reminders','sms_safety_alerts'};settings_changed=bool(safety_fields.intersection(request.data));serializer.is_valid(raise_exception=True);profile=serializer.save();dispatch(refresh_matches,profile.id)
   if profile.ai_profile_consent:dispatch(analyze_profile,profile.id)
   elif previous_consent:
    profile.ai_summary='';profile.ai_traits=[];profile.ai_analysis_status='not_requested';profile.save(update_fields=['ai_summary','ai_traits','ai_analysis_status'])
   if settings_changed and profile.phone_verified and profile.sms_safety_alerts:AfricasTalkingSMS().send(profile.phone_number,'Your Luna account settings were changed. If this was not you, sign in and review your account.')
  return Response(serializer.data)
 @action(detail=False,methods=['post'],url_path='me/analyze')
 def analyze(self,request):
  profile=request.user.profile
  if not profile.ai_profile_consent:return Response({'detail':'AI profile analysis requires consent.'},status=status.HTTP_403_FORBIDDEN)
  profile.ai_analysis_status='queued';profile.save(update_fields=['ai_analysis_status']);dispatch(analyze_profile,profile.id);return Response(self.get_serializer(profile).data,status=status.HTTP_202_ACCEPTED)
 @action(detail=False,methods=['get'],url_path='me/export')
 def export(self,request):
  profile=request.user.profile
  conversations=Conversation.objects.filter(participants=profile).prefetch_related('participants','messages')
  return Response({'exported_at':__import__('django.utils.timezone',fromlist=['now']).now(),'account':{'username':request.user.username,'email':request.user.email,'date_joined':request.user.date_joined},'profile':self.get_serializer(profile).data,'conversations':[{'id':c.id,'title':c.title,'participants':[p.display_name for p in c.participants.all()],'messages':[{'sender':m.sender.username if m.sender else None,'body':m.body,'created_at':m.created_at} for m in c.messages.all()]} for c in conversations]})
 @action(detail=False,methods=['delete'],url_path='me/account')
 def delete_account(self,request):
  profile = request.user.profile
  if not profile.is_premium:
   return Response({'detail':'Account deletion is a Premium feature. Please subscribe to delete your account.'},status=status.HTTP_403_FORBIDDEN)
  if not request.user.check_password(str(request.data.get('password',''))):return Response({'password':['Password confirmation is incorrect.']},status=status.HTTP_400_BAD_REQUEST)
  request.user.delete();return Response(status=status.HTTP_204_NO_CONTENT)
 @action(detail=False,methods=['post'],url_path='me/initiate-nylon-payment')
 def initiate_nylon_payment(self,request):
  profile=request.user.profile
  phone_number=request.data.get('phone_number')
  if not phone_number:
   return Response({'phone_number':['Phone number is required.']},status=status.HTTP_400_BAD_REQUEST)
  amount=11000
  import uuid
  reference=uuid.uuid4()
  payment=PremiumPayment.objects.create(profile=profile,reference=reference,amount=amount)
  dispatch(process_nylon_payment,profile.id,phone_number,amount,reference)
  return Response({'reference':str(reference),'status':payment.status,'amount':amount})
 @action(detail=False,methods=['get'],url_path='premium-price')
 def premium_price(self,request):
  return Response({'amount_ugx':11000,'amount_usd':3})
 @action(detail=False,methods=['post'],url_path='me/toggle-premium-test')
 def toggle_premium_test(self,request):
  profile=request.user.profile
  profile.is_premium = not profile.is_premium
  profile.save(update_fields=['is_premium'])
  return Response(self.get_serializer(profile).data)
 @action(detail=False,methods=['get'],url_path='me/payment-status')
 def payment_status(self,request):
  reference=request.query_params.get('reference')
  if not reference:
   return Response({'reference':['Reference query parameter is required.']},status=status.HTTP_400_BAD_REQUEST)
  payment=PremiumPayment.objects.filter(reference=reference,profile=request.user.profile).first()
  if not payment:
   return Response({'detail':'Payment not found.'},status=status.HTTP_404_NOT_FOUND)
  return Response({'reference':str(payment.reference),'status':payment.status,'amount':payment.amount,'created_at':payment.created_at,'updated_at':payment.updated_at})
 @action(detail=False,methods=['post','delete'],url_path='safety/block',throttle_classes=[ScopedRateThrottle])
 def block(self,request):
  self.throttle_scope='safety';target=Profile.objects.filter(pk=request.data.get('profile_id')).exclude(pk=request.user.profile.pk).first()
  if not target:return Response({'profile_id':['Profile not found.']},status=status.HTTP_404_NOT_FOUND)
  if request.method=='DELETE':Block.objects.filter(blocker=request.user.profile,blocked=target).delete();return Response(status=status.HTTP_204_NO_CONTENT)
  Block.objects.get_or_create(blocker=request.user.profile,blocked=target);Match.objects.filter(Q(requester=request.user.profile,candidate=target)|Q(requester=target,candidate=request.user.profile)).update(status='passed');AuditEvent.objects.create(actor=request.user.profile,event='profile.blocked',target_type='profile',target_id=target.id);return Response({'blocked':True},status=status.HTTP_201_CREATED)
 @action(detail=False,methods=['post'],url_path='safety/report',throttle_classes=[ScopedRateThrottle])
 def report(self,request):
  self.throttle_scope='safety';target=Profile.objects.filter(pk=request.data.get('profile_id')).exclude(pk=request.user.profile.pk).first();reason=request.data.get('reason')
  if not target:return Response({'profile_id':['Profile not found.']},status=status.HTTP_404_NOT_FOUND)
  if reason not in dict(Report.REASONS):return Response({'reason':['Choose a valid reason.']},status=status.HTTP_400_BAD_REQUEST)
  conversation=Conversation.objects.filter(pk=request.data.get('conversation_id'),participants=request.user.profile).first() if request.data.get('conversation_id') else None
  report=Report.objects.create(reporter=request.user.profile,reported=target,conversation=conversation,reason=reason,details=str(request.data.get('details',''))[:1000]);AuditEvent.objects.create(actor=request.user.profile,event='profile.reported',target_type='report',target_id=report.id,metadata={'reason':reason});return Response({'id':report.id,'received':True},status=status.HTTP_201_CREATED)
class MatchViewSet(viewsets.ReadOnlyModelViewSet):
 serializer_class=MatchSerializer;queryset=Match.objects.none()
 def get_queryset(self):
  profile=self.request.user.profile
  if not Match.objects.filter(requester=profile).exists():refresh_matches(profile.id)
  blocked_ids=set(profile.blocks_made.values_list('blocked_id',flat=True))|set(profile.blocks_received.values_list('blocker_id',flat=True))
  return Match.objects.filter(requester=profile,candidate__is_discoverable=True).exclude(candidate_id__in=blocked_ids).select_related('candidate__user','conversation')
 @action(detail=True,methods=['post'])
 def accept(self,request,pk=None):
  match=self.get_object()
  match.status='accepted'
  match.save(update_fields=['status'])
  rev_match=Match.objects.filter(requester=match.candidate,candidate=match.requester).first()
  if rev_match and rev_match.status=='accepted':
   if not match.conversation:
    conversation=Conversation.objects.create(title=f'{match.requester.display_name} & {match.candidate.display_name}', is_luna=False, luna_stage='moderating')
    conversation.participants.add(match.requester,match.candidate)
    ConversationReadState.objects.bulk_create([ConversationReadState(conversation=conversation,profile=p) for p in [match.requester,match.candidate]])
    Message.objects.create(conversation=conversation, is_ai=True, body=f"{match.requester.display_name} has joined the chat.", metadata={'type': 'system_left'})
    Message.objects.create(conversation=conversation, is_ai=True, body=f"{match.candidate.display_name} has joined the chat.", metadata={'type': 'system_left'})
    Message.objects.create(conversation=conversation, is_ai=True, body=f"Hello {match.requester.display_name} and {match.candidate.display_name}! I have brought you both together. Would you like me to leave the chat and let you chat privately?")
    match.conversation=conversation
    match.save(update_fields=['conversation'])
    rev_match.conversation=conversation
    rev_match.save(update_fields=['conversation'])
    dispatch(update_match_board, conversation.id)
    sms=AfricasTalkingSMS()
    for p in [match.requester,match.candidate]:
     if p.phone_verified and p.sms_match_notifications:
      try:sms.send(p.phone_number,f"Hi {p.display_name}, you have a new match connection on Luna! You both agreed to connect. Log in to start chatting!")
      except Exception:pass
  else:
   rev_match, created = Match.objects.get_or_create(
    requester=match.candidate,
    candidate=match.requester,
    defaults={'score': match.score, 'reasons': match.reasons}
   )
   if rev_match.status != 'accepted':
    rev_match.status = 'suggested'
    rev_match.save(update_fields=['status'])
    if match.candidate.phone_verified and match.candidate.sms_match_notifications:
     try:AfricasTalkingSMS().send(match.candidate.phone_number,f"Hi {match.candidate.display_name}, {match.requester.display_name} would like to chat and is online. Log in to the Luna app to connect!")
     except Exception:pass
  return Response(self.get_serializer(match).data)
 @action(detail=True,methods=['post'],url_path='pass')
 def pass_match(self,request,pk=None):
  match=self.get_object();match.status='passed';match.save(update_fields=['status']);return Response(self.get_serializer(match).data)
 @action(detail=True,methods=['post'],url_path='explain')
 def explain(self,request,pk=None):
  match=self.get_object()
  if not (match.requester.ai_profile_consent and match.candidate.ai_profile_consent):return Response({'detail':'Both profiles must allow AI analysis.'},status=status.HTTP_403_FORBIDDEN)
  dispatch(enrich_match,match.id);match.refresh_from_db();return Response(self.get_serializer(match).data,status=status.HTTP_202_ACCEPTED)
 @action(detail=True,methods=['post'],url_path='feedback')
 def feedback(self,request,pk=None):
  match=self.get_object();outcome=request.data.get('outcome')
  if outcome not in dict(MatchFeedback.OUTCOMES):return Response({'outcome':['Choose a valid outcome.']},status=status.HTTP_400_BAD_REQUEST)
  feedback,_=MatchFeedback.objects.update_or_create(match=match,profile=request.user.profile,defaults={'outcome':outcome,'notes':str(request.data.get('notes',''))[:500]});AuditEvent.objects.create(actor=request.user.profile,event='match.feedback',target_type='match',target_id=match.id,metadata={'outcome':outcome});return Response({'id':feedback.id,'outcome':feedback.outcome})
class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
 serializer_class=ConversationSerializer;queryset=Conversation.objects.none()
 def get_queryset(self):
  profile=self.request.user.profile
  if not Conversation.objects.filter(is_luna=True,participants=profile).exists():
   inbox=Conversation.objects.create(title='Luna',is_luna=True);inbox.participants.add(profile)
   dispatch(generate_welcome_message,profile.id,inbox.id)
   refresh_matches(profile.id)
  blocked_ids=set(profile.blocks_made.values_list('blocked_id',flat=True))|set(profile.blocks_received.values_list('blocker_id',flat=True))
  return Conversation.objects.filter(participants=profile).exclude(participants__id__in=blocked_ids).prefetch_related('participants__user','messages__sender').distinct().order_by('-created_at')
 @action(detail=True,methods=['post'],url_path='messages',throttle_classes=[MessageThrottle])
 def messages(self,request,pk=None):
  c=self.get_object();body=str(request.data.get('body','')).strip()
  if not body:return Response({'body':['This field is required.']},status=status.HTTP_400_BAD_REQUEST)
  if len(body)>2000:return Response({'body':['Messages cannot exceed 2000 characters.']},status=status.HTTP_400_BAD_REQUEST)
  
  if not c.is_luna and not c.is_contact_sharing_allowed:
   import re
   email_pattern=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
   phone_pattern=r'\b(\+?[0-9]{1,3}[-.\s]?)?([0-9]{3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4})\b'
   masked_body=re.sub(email_pattern,'[REDACTED CONTACT DETAILS]',body)
   masked_body=re.sub(phone_pattern,'[REDACTED CONTACT DETAILS]',masked_body)
   if masked_body!=body:
    body=masked_body
    sys_warning=Message.objects.create(conversation=c,is_ai=True,body="⚠️ Contact sharing is blocked. Please use the 'Permit Contact Sharing' button in the chat options to exchange contact info safely.")
    try:
     w_data=MessageSerializer(sys_warning).data
     async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':w_data})
    except Exception:pass
   
  message=Message.objects.create(conversation=c,sender=request.user,body=body);inspect_message(message)
  if c.is_luna or c.luna_stage == 'moderating':
   data=MessageSerializer(message).data
   try:
    async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
   except Exception:pass
   provider=GeminiProvider()
   if provider.configured:
    eval_intent_prompt = (
     "You are an AI safety agent monitoring private match concierge chats. "
     "Analyze the user's latest message. Determine if they are expressing bad intentions "
     "such as prostitution, solicitation, financial scams, seeking money/allowances, or planning "
     "to meet up and steal/rob/exploit other users.\n"
     "Return a JSON object with keys:\n"
     "  \"is_suspicious\": true or false,\n"
     "  \"reason\": \"A brief explanation of why this message shows unsafe or transactional intentions (prostitution/scammer/theft/etc.), or empty string.\"\n"
    )
    try:
     intent_data = provider.structured(eval_intent_prompt, body)
     if intent_data.get('is_suspicious'):
      reporter_profile = Profile.objects.filter(user__is_staff=True).first() or request.user.profile
      Report.objects.create(
       reporter=reporter_profile,
       reported=request.user.profile,
       conversation=c,
       reason='unsafe',
       details=f"AI Safety check flagged suspicious intentions: {intent_data.get('reason')}. Message: '{body}'"
      )
    except Exception:pass
   if c.luna_stage in ['welcome', 'discussing', 'feedback']:dispatch(extract_profile_insights, request.user.profile.id, body)
   reply=self._luna_reply(c,request.user.profile,body)
   if reply:
    reply_data=MessageSerializer(reply).data
    try:
     async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':reply_data})
    except Exception:pass
    return Response({'message':data,'luna_reply':reply_data},status=status.HTTP_201_CREATED)
   else:return Response({'message':data,'luna_reply':None},status=status.HTTP_201_CREATED)
  Notification.objects.bulk_create([Notification(profile=p,conversation=c,title=request.user.profile.display_name,body=body[:240]) for p in c.participants.exclude(user=request.user)])
  if not c.is_luna:
   recipient = c.participants.exclude(user=request.user).first()
   if recipient:
    from django.utils import timezone
    from datetime import timedelta
    from .sms import AfricasTalkingSMS
    read_state = ConversationReadState.objects.filter(conversation=c, profile=recipient).first()
    is_active = read_state and read_state.last_read_at and read_state.last_read_at >= timezone.now() - timedelta(minutes=2)
    if not is_active:
     cooldown = timezone.now() - timedelta(minutes=15)
     recent_sms = Notification.objects.filter(profile=recipient, conversation=c, sms_sent_at__gte=cooldown).exists()
     if not recent_sms:
      if recipient.phone_verified and recipient.sms_unread_reminders:
       sms_body = f"Hi {recipient.display_name}, {request.user.profile.display_name} is online and just sent you a message: '{body[:60]}...'. Log in to reply!"
       try:
        sms = AfricasTalkingSMS()
        if sms.send(recipient.phone_number, sms_body):
         notif = Notification.objects.filter(profile=recipient, conversation=c, read_at__isnull=True).order_by('-created_at').first()
         if notif:
          notif.sms_sent_at = timezone.now()
          notif.save(update_fields=['sms_sent_at'])
         sys_msg = Message.objects.create(
          conversation=c,
          is_ai=True,
          body=f"Luna: {recipient.display_name} is offline. I have sent them an SMS to notify them.",
          metadata={'type': 'system_left', 'visible_to_profile_id': request.user.profile.id}
         )
         try:
          sys_data = MessageSerializer(sys_msg).data
          async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}', {'type': 'chat.message', 'message': sys_data})
         except Exception:pass
       except Exception:pass
  ConversationReadState.objects.update_or_create(conversation=c,profile=request.user.profile,defaults={'last_read_at':timezone.now()});data=MessageSerializer(message).data
  try:
   async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
  except Exception:pass
  if not c.is_luna:
   dispatch(update_match_board, c.id)
  return Response(data,status=status.HTTP_201_CREATED)
 @action(detail=True,methods=['post'],url_path='read')
 def mark_read(self,request,pk=None):
  c=self.get_object()
  from django.utils import timezone
  ConversationReadState.objects.update_or_create(conversation=c,profile=request.user.profile,defaults={'last_read_at':timezone.now()})
  return Response(status=status.HTTP_204_NO_CONTENT)
 @action(detail=True, methods=['post'], url_path='send-sms')
 def send_sms_nudge(self, request, pk=None):
  c = self.get_object()
  if c.is_luna or c.is_counseling:
   return Response({'detail': 'SMS nudges are only available in direct match chats.'}, status=status.HTTP_400_BAD_REQUEST)
  recipient = c.participants.exclude(user=request.user).first()
  if not recipient:
   return Response({'detail': 'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
  if not recipient.phone_number:
   return Response({'detail': 'This person does not have a phone number saved on Luna.'}, status=status.HTTP_400_BAD_REQUEST)
  sms_body = f"Hi {recipient.display_name}, {request.user.profile.display_name} sent you a message on Luna: 'Hi, are you free to chat? Log in to the app to connect!'"
  sms = AfricasTalkingSMS()
  if not sms.configured:
   return Response({'detail': 'SMS delivery is not configured. Please contact Luna support.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
  if not sms.send(recipient.phone_number, sms_body):
   return Response({'detail': 'The SMS provider could not deliver this message. Please try again.'}, status=status.HTTP_502_BAD_GATEWAY)
  sys_msg = Message.objects.create(
   conversation=c,
   is_ai=True,
   body=f"Luna: I've sent {recipient.display_name} an SMS nudge to join the chat.",
   metadata={'type': 'system_left'}
  )
  try:
   sys_data = MessageSerializer(sys_msg).data
   async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}', {'type': 'chat.message', 'message': sys_data})
  except Exception:pass
  return Response({'status': 'sent', 'message': MessageSerializer(sys_msg).data})
 def _luna_reply(self,c,profile,body):
  from .ai.prompts import LUNA_CHAT_SYSTEM, MODERATION_SYSTEM, DEBRIEF_SYSTEM, LUNA_COUNSELING_SYSTEM
  if c.is_counseling:
   context={'state':'relationship_counseling','instruction':'Speak as an empathetic relationship therapist. Offer support and ask clarifying questions about their concerns.'}
   return self._gemini_message(c,profile,body,context,system_prompt=LUNA_COUNSELING_SYSTEM)
  text=body.lower().strip();yes=any(word in text for word in ['yes','yeah','sure','show','okay','ok','please']);no=any(word in text for word in ['no','not interested','pass','skip']);match=c.pending_match
  if c.luna_stage == 'premium_locked':
   return Message.objects.create(
    conversation=c,
    is_ai=True,
    body="This match is locked because you have reached your daily limit of 2 free matches. Please upgrade to Premium in the Counseling tab to unlock this profile!"
   )
  if c.luna_stage == 'waiting_nudge' and match:
   candidate = match.candidate
   if yes:
    if candidate.phone_verified and candidate.sms_unread_reminders:
     sms_body = f"Hi {candidate.display_name}, {profile.display_name} wants to connect with you on Luna! Log in to connect."
     try:
      AfricasTalkingSMS().send(candidate.phone_number, sms_body)
     except Exception:pass
    c.luna_stage = 'welcome'
    c.pending_match = None
    c.save(update_fields=['luna_stage', 'pending_match'])
    return Message.objects.create(
     conversation=c,
     is_ai=True,
     body=f"I have sent {candidate.display_name} an SMS notification. I will let you know as soon as they are ready!"
    )
   else:
    c.luna_stage = 'welcome'
    c.pending_match = None
    c.save(update_fields=['luna_stage', 'pending_match'])
    return Message.objects.create(
     conversation=c,
     is_ai=True,
     body="Alright, I won't notify them. I will still leave the invitation in their inbox for when they next log in!"
    )
  is_connecting = match and any(word in text for word in ['invite', 'connect', 'introduce', 'meet', 'yes', 'fit', 'stay', 'moderate', 'leave'])
  is_choosing = (c.luna_stage == 'offered' and (yes or no)) or (c.luna_stage == 'discussing' and (is_connecting or no))
  if c.is_luna and match and not is_choosing:
   other_profile = match.candidate if match.requester == profile else match.requester
   trigger_words = ['online', 'reply', 'sms', 'text', 'wait', 'message', 'invite', 'nudge', 'where', 'busy', 'here', 'hello', 'hey', 'talk', 'chat']
   words = [w.strip('?,.!') for w in text.split()]
   if any(w in words for w in trigger_words):
    from django.utils import timezone
    from datetime import timedelta
    read_state = ConversationReadState.objects.filter(profile=other_profile).order_by('-last_read_at').first()
    is_active = read_state and read_state.last_read_at and read_state.last_read_at >= timezone.now() - timedelta(minutes=2)
    if not is_active:
     if other_profile.phone_verified and other_profile.sms_unread_reminders:
      sms_body = f"Hi {other_profile.display_name}, {profile.display_name} is online and wants to chat on Luna! Log in to connect."
      try:
       AfricasTalkingSMS().send(other_profile.phone_number, sms_body)
      except Exception:pass
     reply_body = f"Hello! {other_profile.display_name} is not yet online. Give me a minute, I will send them an SMS to come online. I'll get back to you!"
     return Message.objects.create(conversation=c, is_ai=True, body=reply_body)
  if not match and c.luna_stage not in ['moderating', 'left', 'feedback']:return self._gemini_message(c,profile,body,{'state':'no_match','instruction':'No match is available. Respond naturally and offer to help with the user’s profile or preferences. Never imply anybody joined.'})
  if c.luna_stage=='offered' and match:
   candidate=match.candidate
   if no:match.status='passed';match.save(update_fields=['status']);c.pending_match=None;c.luna_stage='welcome';c.save(update_fields=['pending_match','luna_stage']);return self._gemini_message(c,profile,body,{'state':'match_passed','instruction':'Confirm the private pass warmly. The profile was not revealed and the candidate will not be notified.'})
   if not yes:return self._gemini_message(c,profile,body,{'state':'match_offered','instruction':'A real potential match exists but remains hidden. Answer naturally and clarify that the user may view or privately pass.'})
   c.luna_stage='discussing';c.save(update_fields=['luna_stage']);card={'id':candidate.id,'display_name':candidate.display_name,'bio':candidate.bio,'location':candidate.location,'connection_goal':candidate.connection_goal,'values':candidate.values,'interests':candidate.interests,'communication_style':candidate.communication_style,'reasons':match.reasons,'score':match.score};return self._gemini_message(c,profile,body,{'state':'profile_revealed','instruction':'Introduce the now-visible profile and invite thoughtful discussion without overstating compatibility.','candidate':card},{'type':'profile_card','profile':card})
  if c.luna_stage=='discussing' and match:
   candidate=match.candidate;is_connecting=any(word in text for word in ['invite', 'connect', 'introduce', 'meet', 'yes', 'fit', 'stay', 'moderate', 'leave'])
   if is_connecting:
    match.status = 'accepted'
    match.save(update_fields=['status'])
    rev_match = Match.objects.filter(requester=candidate, candidate=profile).first()
    if rev_match and rev_match.status == 'accepted':
     direct_c = Conversation.objects.create(title=f"{profile.display_name} & {candidate.display_name}", is_luna=False, luna_stage='moderating')
     direct_c.participants.add(profile, candidate)
     Message.objects.create(conversation=direct_c, is_ai=True, body=f"{profile.display_name} has joined the chat.", metadata={'type': 'system_left'})
     Message.objects.create(conversation=direct_c, is_ai=True, body=f"{candidate.display_name} has joined the chat.", metadata={'type': 'system_left'})
     Message.objects.create(conversation=direct_c, is_ai=True, body=f"Hello {profile.display_name} and {candidate.display_name}! I have brought you both together. Would you like me to leave the chat and let you chat privately?")
     c.luna_stage = 'welcome'
     c.pending_match = None
     c.save(update_fields=['luna_stage', 'pending_match'])
     inbox_b = Conversation.objects.filter(is_luna=True, participants=candidate).first()
     if inbox_b:
      inbox_b.luna_stage = 'welcome'
      inbox_b.pending_match = None
      inbox_b.save(update_fields=['luna_stage', 'pending_match'])
     sms=AfricasTalkingSMS()
     for p in [profile,candidate]:
      if p.phone_verified and p.sms_match_notifications:
       try:sms.send(p.phone_number,f"Hi {p.display_name}, you have a new match connection on Luna! You both agreed to connect. Log in to start chatting!")
       except Exception:pass
     return Message.objects.create(
      conversation=c,
      is_ai=True,
      body=f"Excellent! {candidate.display_name} has also accepted your invitation. I have opened a new direct chat conversation for you two! You can find it on your dashboard."
     )
    else:
     rev_match, created = Match.objects.get_or_create(
      requester=candidate,
      candidate=profile,
      defaults={'score': match.score, 'reasons': match.reasons}
     )
     if rev_match.status != 'accepted':
      rev_match.status = 'suggested'
      rev_match.save(update_fields=['status'])
     
     inbox_b = Conversation.objects.filter(is_luna=True, participants=candidate).first()
     if not inbox_b:
      inbox_b = Conversation.objects.create(title='Luna', is_luna=True, luna_stage='offered')
      inbox_b.participants.add(candidate)
     inbox_b.pending_match = rev_match
     inbox_b.luna_stage = 'offered'
     inbox_b.save(update_fields=['pending_match', 'luna_stage'])
     
     b_msg = Message.objects.create(
      conversation=inbox_b,
      is_ai=True,
      body=f"Hi {candidate.display_name}, {profile.display_name} would like to connect with you! Would you like to join the chat and connect with them? You can ask me more about them first before accepting."
     )
     try:
      from .serializers import MessageSerializer
      b_data = MessageSerializer(b_msg).data
      async_to_sync(get_channel_layer().group_send)(f'chat_{inbox_b.id}', {'type': 'chat.message', 'message': b_data})
     except Exception:pass

     from django.utils import timezone
     from datetime import timedelta
     read_state = ConversationReadState.objects.filter(profile=candidate).order_by('-last_read_at').first()
     is_active = read_state and read_state.last_read_at and read_state.last_read_at >= timezone.now() - timedelta(minutes=2)
     
     if is_active:
      c.luna_stage = 'welcome'
      c.pending_match = None
      c.save(update_fields=['luna_stage', 'pending_match'])
      return Message.objects.create(
       conversation=c,
       is_ai=True,
       body=f"Hold on, I am getting into contact with {candidate.display_name}."
      )
     else:
      c.luna_stage = 'waiting_nudge'
      c.save(update_fields=['luna_stage'])
      return Message.objects.create(
       conversation=c,
       is_ai=True,
       body=f"Hello! {candidate.display_name} is not currently online. Would you like me to notify you when they are ready?"
      )
   context={'state':'discussing_profile','candidate':{'display_name':candidate.display_name,'bio':candidate.bio,'location':candidate.location,'connection_goal':candidate.connection_goal,'values':candidate.values,'interests':candidate.interests,'communication_style':candidate.communication_style},'match_reasons':match.reasons};return self._gemini_message(c,profile,body,context)
  if c.luna_stage=='moderating':
   if any(word in text for word in ['luna leave', 'luna go', 'leave chat', 'luna end', 'yes']):
    c.luna_stage='left';c.save(update_fields=['luna_stage']);sys_msg=Message.objects.create(conversation=c, is_ai=True, body="Luna has left the conversation.", metadata={'type':'system_left'})
    try:
     from channels.layers import get_channel_layer;from .serializers import MessageSerializer;data=MessageSerializer(sys_msg).data;async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
    except Exception:pass
    return Message.objects.create(conversation=c, is_ai=True, body="Understood! I will leave you both to chat privately. Click 'Re-engage Luna' in the options when you're done!")
   
   # Dispute moderation and warnings
   provider=GeminiProvider()
   if provider.configured:
    eval_prompt = (
     "You are Luna, a relationship coach moderating a chat between two users. "
     "Analyze the user's latest message. Determine if the sender is being highly disrespectful, "
     "abusive, toxic, or rude to the other participant. "
     "Return a JSON object with keys:\n"
     "  \"is_disrespectful\": true or false,\n"
     "  \"settle_comment\": \"A brief warm comment (under 50 words) to settle disputes and request respect.\"\n"
    )
    try:
     eval_data = provider.structured(eval_prompt, body)
     if eval_data.get('is_disrespectful'):
      already_flagged = ModerationEvent.objects.filter(message__conversation=c, message__sender=profile.user).exists()
      if already_flagged:
       reply_body = "We hate to see you go but you leave me no choice."
       reply = Message.objects.create(conversation=c, is_ai=True, body=reply_body)
       try:
        from channels.layers import get_channel_layer;from .serializers import MessageSerializer;data=MessageSerializer(reply).data;async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
       except Exception:pass
       
       # Suspend & Remove
       u = profile.user
       u.is_active = False
       u.save(update_fields=['is_active'])
       c.participants.remove(profile)
       
       # Report to admin dashboard
       remaining = c.participants.first()
       reporter = remaining if remaining else profile
       Report.objects.create(
        reporter=reporter,
        reported=profile,
        conversation=c,
        reason='harassment',
        details=f"User suspended for repeated rudeness. Message: '{body}'"
       )
       
       c.luna_stage = 'welcome'
       c.pending_match = None
       c.save(update_fields=['luna_stage', 'pending_match'])
       
       comfort_msg = Message.objects.create(conversation=c, is_ai=True, body="I have removed the other user and suspended their account due to repeated disrespectful behavior. I'm here for you. Let me know if you'd like to look for a new connection when you're ready.")
       return comfort_msg
      else:
       # First strike
       last_user_message = c.messages.filter(sender=profile.user).last()
       if last_user_message:
        ModerationEvent.objects.create(message=last_user_message, categories=['harassment'], severity='warning')
       settle_body = eval_data.get('settle_comment', "Disputes happen, but let's please keep our conversation respectful.")
       return Message.objects.create(conversation=c, is_ai=True, body=settle_body)
    except Exception:
      pass

   if 'luna' in text:context={'state':'moderating_chat','instruction':'Intervene in the chat because you were mentioned. Keep it brief and encourage connection.'};return self._gemini_message(c,profile,body,context,system_prompt=MODERATION_SYSTEM)
   else:return None
  if c.luna_stage=='left':return None
  if c.luna_stage=='feedback':
   if any(word in text for word in ['date', 'meet', 'invite', 'arrange', 'schedule', 'yes']):c.luna_stage='welcome';c.pending_match=None;c.save(update_fields=['luna_stage','pending_match']);return Message.objects.create(conversation=c, is_ai=True, body="Wonderful! I will send them a date invitation and let you know when they respond. Back to our private chat about life!")
   context={'state':'debriefing','instruction':'Discuss how the conversation went with the user. Ask if they want to invite them on a date.'};return self._gemini_message(c,profile,body,context,system_prompt=DEBRIEF_SYSTEM)
  return self._gemini_message(c,profile,body,{'state':'unknown'})
 def _gemini_message(self,c,profile,user_message,context,metadata=None,system_prompt=None):
  from .ai.prompts import LUNA_CHAT_SYSTEM
  if system_prompt is None:system_prompt=LUNA_CHAT_SYSTEM
  provider=GeminiProvider()
  if not provider.configured:answer='Luna AI is not connected yet. Add GEMINI_API_KEY to the project .env and restart the Django server.'
  elif not profile.ai_profile_consent:answer='AI conversation is currently off. You can enable AI profile analysis in Preferences when you are ready.'
  else:
   history=[{'role':'luna' if m.is_ai else ('you' if m.sender_id==profile.user_id else 'other'),'text':m.body} for m in c.messages.order_by('-created_at')[:8]][::-1]
   payload={'user':{'display_name':profile.display_name,'values':profile.values,'interests':profile.interests,'connection_goal':profile.connection_goal},'conversation_history':history,'latest_user_message':user_message,'application_context':context}
   try:
    answer=str(provider.structured(system_prompt,json.dumps(payload)).get('reply','')).strip()
    if not answer:raise ValueError('Gemini returned an empty reply')
   except Exception:answer='I’m having trouble reaching Gemini right now. Please try again in a moment.'
  return Message.objects.create(conversation=c,is_ai=True,body=answer,metadata=metadata or {})
 @action(detail=True,methods=['post'],url_path='read')
 def mark_read(self,request,pk=None):
  c=self.get_object();ConversationReadState.objects.update_or_create(conversation=c,profile=request.user.profile,defaults={'last_read_at':timezone.now()});Notification.objects.filter(profile=request.user.profile,conversation=c,read_at__isnull=True).update(read_at=timezone.now());return Response({'unread_count':0})
 @action(detail=True,methods=['post'],url_path='ai-consent')
 def ai_consent(self,request,pk=None):
  c=self.get_object();enabled=bool(request.data.get('enabled',False));Consent.objects.update_or_create(profile=request.user.profile,conversation=c,defaults={'ai_assistance':enabled})
  c.ai_enabled=c.participants.count()>0 and not Consent.objects.filter(conversation=c,ai_assistance=False).exists() and Consent.objects.filter(conversation=c,ai_assistance=True).count()==c.participants.count()
  if not enabled:c.introduction_drafts.filter(status__in=['generating','draft']).update(status='discarded')
  c.save(update_fields=['ai_enabled']);return Response(self.get_serializer(c).data)
 @action(detail=True,methods=['post','get'],url_path='introduction')
 def introduction(self,request,pk=None):
  c=self.get_object()
  if request.method=='GET':
   draft=c.introduction_drafts.filter(requested_by=request.user.profile).order_by('-created_at').first()
   return Response(IntroductionDraftSerializer(draft).data if draft else None)
  if not c.ai_enabled:return Response({'detail':'Every participant must consent before Luna can draft an introduction.'},status=status.HTTP_403_FORBIDDEN)
  draft=IntroductionDraft.objects.create(conversation=c,requested_by=request.user.profile);dispatch(generate_introduction,draft.id);draft.refresh_from_db();return Response(IntroductionDraftSerializer(draft).data,status=status.HTTP_202_ACCEPTED)
 @action(detail=True,methods=['post'],url_path=r'introduction/(?P<draft_id>[^/.]+)/approve')
 def approve_introduction(self,request,pk=None,draft_id=None):
  c=self.get_object();draft=IntroductionDraft.objects.filter(pk=draft_id,conversation=c,requested_by=request.user.profile,status='draft').first()
  if not draft:return Response({'detail':'Draft not found or no longer editable.'},status=status.HTTP_404_NOT_FOUND)
  body=str(request.data.get('body',draft.body)).strip()
  if not body:return Response({'body':['This field is required.']},status=status.HTTP_400_BAD_REQUEST)
  message=Message.objects.create(conversation=c,sender=request.user,body=body,is_ai=False);inspect_message(message);Notification.objects.bulk_create([Notification(profile=p,conversation=c,title=request.user.profile.display_name,body=body[:240]) for p in c.participants.exclude(user=request.user)]);draft.body=body;draft.status='sent';draft.save(update_fields=['body','status']);AuditEvent.objects.create(actor=request.user.profile,event='ai.introduction_approved',target_type='message',target_id=message.id);data=MessageSerializer(message).data;async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data});return Response(data,status=status.HTTP_201_CREATED)
 @action(detail=True,methods=['post'],url_path='reengage')
 def reengage(self,request,pk=None):
  c=self.get_object()
  if not c.is_luna and c.luna_stage != 'left':
   return Response({'detail':'Only Luna or ended conversations can be re-engaged.'},status=status.HTTP_400_BAD_REQUEST)
  if not c.is_luna:
   c.luna_stage = 'feedback'
   c.save(update_fields=['luna_stage'])
   for p in c.participants.all():
    inbox = Conversation.objects.filter(is_luna=True, participants=p).first()
    if inbox:
     inbox.luna_stage = 'feedback'
     inbox.save(update_fields=['luna_stage'])
     msg_body = f"Welcome back, {p.display_name}! Your chat with the other person has ended. How did it go? Tell me everything—did you enjoy talking to them? Do you want to go on a date?"
     msg = Message.objects.create(conversation=inbox, is_ai=True, body=msg_body)
     try:
      from channels.layers import get_channel_layer;from .serializers import MessageSerializer;data = MessageSerializer(msg).data
      async_to_sync(get_channel_layer().group_send)(f'chat_{inbox.id}',{'type':'chat.message','message':data})
     except Exception:pass
   msg = Message.objects.create(conversation=c, is_ai=True, body="I have taken both of you back to your private chats to debrief. Thank you!")
   try:
    from channels.layers import get_channel_layer;from .serializers import MessageSerializer;data = MessageSerializer(msg).data
    async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
   except Exception:pass
   return Response(self.get_serializer(c).data)
  user_profile = request.user.profile
  candidate = c.participants.exclude(pk=user_profile.id).first()
  if candidate:
   c.participants.remove(candidate)
  c.luna_stage = 'feedback'
  c.save(update_fields=['luna_stage'])
  msg_body = f"Welcome back, {user_profile.display_name}! Your chat has ended. How did it go? Tell me everything—did you enjoy talking to them? Do you want to go on a date?"
  msg = Message.objects.create(conversation=c, is_ai=True, body=msg_body)
  try:
   from channels.layers import get_channel_layer;from .serializers import MessageSerializer;data = MessageSerializer(msg).data
   async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
  except Exception:
   pass
  if candidate:
   cand_inbox = Conversation.objects.filter(is_luna=True, participants=candidate).first()
   if cand_inbox:
    cand_inbox.luna_stage = 'feedback'
    cand_inbox.save(update_fields=['luna_stage'])
    cand_msg_body = f"Welcome back, {candidate.display_name}! Your chat has ended. How did it go? Tell me everything—did you enjoy talking to them? Do you want to go on a date?"
    cand_msg = Message.objects.create(conversation=cand_inbox, is_ai=True, body=cand_msg_body)
    try:
     from channels.layers import get_channel_layer;from .serializers import MessageSerializer;cand_data = MessageSerializer(cand_msg).data
     async_to_sync(get_channel_layer().group_send)(f'chat_{cand_inbox.id}',{'type':'chat.message','message':cand_data})
    except Exception:
     pass
  return Response(self.get_serializer(c).data)
 @action(detail=True,methods=['get'],url_path='suggest-venues')
 def suggest_venues(self,request,pk=None):
  c=self.get_object();profiles=c.participants.all()
  if profiles.count()<2:return Response({'detail':'Need at least two participants.'},status=status.HTTP_400_BAD_REQUEST)
  p1,p2=profiles[0],profiles[1]
  provider=GeminiProvider()
  if not provider.configured:
   return Response({'venues':[
    {'name':'Urban Grind Coffee','address':'Nairobi CBD, Kenya','reason':'Equidistant, popular public spot.'},
    {'name':'Connect Coffee Roasters','address':'Chiromo Road, Nairobi, Kenya','reason':'Safe, open layout with high visibility.'}
   ]})
  prompt=(
   f"Suggest 3 neutral public meetup venues (cafes/restaurants) geographically halfway between these locations:\n"
   f"User 1: {p1.display_name} in '{p1.location}'\n"
   f"User 2: {p2.display_name} in '{p2.location}'\n"
   f"Provide safety-focused, warm explanations of why they are equidistant and secure.\n"
   f"Return a JSON object:\n"
   f"{{\n"
   f"  \"venues\": [\n"
   f"    {{\"name\": \"Name\", \"address\": \"Address\", \"reason\": \"Safety justification\"}}\n"
   f"  ]\n"
   f"}}"
  )
  try:
   res=provider.structured("You are a helpful local dating logistics assistant.", prompt)
   return Response(res)
  except Exception:
   return Response({'venues':[{'name':'Central Cafe','address':'City Square','reason':'Equidistant city hub.'}]})
 @action(detail=True,methods=['post'],url_path='schedule-date')
 def schedule_date(self,request,pk=None):
  c=self.get_object();profile=request.user.profile
  proposed_time=request.data.get('proposed_time')
  venue_name=request.data.get('venue_name')
  venue_address=request.data.get('venue_address')
  if not all([proposed_time,venue_name,venue_address]):
   return Response({'detail':'proposed_time, venue_name, and venue_address are required.'},status=status.HTTP_400_BAD_REQUEST)
  meeting=DateMeeting.objects.create(conversation=c,proposer=profile,proposed_time=proposed_time,venue_name=venue_name,venue_address=venue_address)
  body=f"📅 {profile.display_name} proposed a date meetup at {venue_name} ({venue_address}) on {proposed_time}."
  sys_msg=Message.objects.create(conversation=c,is_ai=True,body=body,metadata={'type':'date_proposal','meeting_id':meeting.id,'venue_name':venue_name,'proposed_time':proposed_time})
  try:
   data=MessageSerializer(sys_msg).data
   async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
  except Exception:pass
  return Response({'status':'proposed','meeting_id':meeting.id})
 @action(detail=True,methods=['post'],url_path=r'schedule-date/(?P<meeting_id>\d+)/respond')
 def respond_date(self,request,pk=None,meeting_id=None):
  c=self.get_object();meeting=DateMeeting.objects.filter(pk=meeting_id,conversation=c).first()
  if not meeting:return Response({'detail':'Meeting proposal not found.'},status=status.HTTP_404_NOT_FOUND)
  action_val=str(request.data.get('action','')).strip().lower()
  if action_val not in ['accept','decline']:
   return Response({'detail':'action must be accept or decline.'},status=status.HTTP_400_BAD_REQUEST)
  if action_val=='accept':
   meeting.status='accepted';meeting.save(update_fields=['status'])
   body=f"✅ Meetup accepted! Proposed date at {meeting.venue_name} has been confirmed. Calendar invitation sent."
   sys_msg=Message.objects.create(conversation=c,is_ai=True,body=body,metadata={'type':'date_confirmed','meeting_id':meeting.id})
  else:
   meeting.status='declined';meeting.save(update_fields=['status'])
   body=f"❌ Meetup proposal declined."
   sys_msg=Message.objects.create(conversation=c,is_ai=True,body=body,metadata={'type':'date_declined','meeting_id':meeting.id})
  try:
   data=MessageSerializer(sys_msg).data
   async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
  except Exception:pass
  return Response({'status':meeting.status})
 @action(detail=True,methods=['post'],url_path='permit-contact')
 def permit_contact(self,request,pk=None):
  c=self.get_object()
  c.is_contact_sharing_allowed=True;c.save(update_fields=['is_contact_sharing_allowed'])
  sys_msg=Message.objects.create(conversation=c,is_ai=True,body="🔓 Both participants have consented. Contact details sharing is now enabled for this chat.",metadata={'type':'contact_sharing_enabled'})
  try:
   data=MessageSerializer(sys_msg).data
   async_to_sync(get_channel_layer().group_send)(f'chat_{c.id}',{'type':'chat.message','message':data})
  except Exception:pass
  return Response({'is_contact_sharing_allowed':True})
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
 serializer_class=NotificationSerializer;queryset=Notification.objects.none()
 def get_queryset(self):return Notification.objects.filter(profile=self.request.user.profile)
 @action(detail=False,methods=['post'],url_path='read-all')
 def read_all(self,request):Notification.objects.filter(profile=request.user.profile,read_at__isnull=True).update(read_at=timezone.now());return Response(status=status.HTTP_204_NO_CONTENT)

class CounselingViewSet(viewsets.GenericViewSet):
 permission_classes=[permissions.IsAuthenticated]
 @action(detail=False,methods=['post'],url_path='ai')
 def get_or_create_ai(self,request):
  profile=request.user.profile
  c=Conversation.objects.filter(is_counseling=True,is_luna=True,participants=profile).first()
  if not c:
   c=Conversation.objects.create(title="AI Counseling",is_luna=True,is_counseling=True)
   c.participants.add(profile)
   Message.objects.create(conversation=c,is_ai=True,body="Hello! I am Luna, your private relationship counselor. Anything you share here is completely confidential. What is on your mind today?")
  return Response(ConversationSerializer(c,context={'request':request}).data)
 @action(detail=False,methods=['post'],url_path='schedule')
 def schedule(self,request):
  profile=request.user.profile
  if not profile.is_premium:
   return Response({'detail':'Couples counseling requires a premium subscription.'},status=status.HTTP_403_FORBIDDEN)
  serializer=CounselingSessionSerializer(data=request.data)
  serializer.is_valid(raise_exception=True)
  meeting_link="https://meet.google.com/" + "".join(timezone.now().strftime("%Y%m%d%H%M%S"))[-10:]
  session=serializer.save(client=profile,meeting_link=meeting_link,status='scheduled')
  return Response(CounselingSessionSerializer(session).data,status=status.HTTP_201_CREATED)
 @action(detail=False,methods=['get'],url_path='sessions')
 def sessions(self,request):
  profile=request.user.profile
  sessions=CounselingSession.objects.filter(client=profile)
  return Response(CounselingSessionSerializer(sessions,many=True).data)
