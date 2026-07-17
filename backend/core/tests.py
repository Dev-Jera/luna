from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from .models import Block,Consent,Conversation,IntroductionDraft,Match,MatchFeedback,Message,ModerationEvent,Notification,Report

@override_settings(SECURE_SSL_REDIRECT=False)
class LunaJourneyTests(APITestCase):
 def setUp(self):
  self.user=User.objects.create_user('amani',password='strongpass123');self.other=User.objects.create_user('amara',password='strongpass123')
  self.client.force_authenticate(self.user)
  from unittest.mock import patch
  self.structured_patcher = patch('core.ai.gemini.GeminiProvider.structured')
  self.embed_patcher = patch('core.ai.gemini.GeminiProvider.embed')
  self.mock_structured = self.structured_patcher.start()
  self.mock_embed = self.embed_patcher.start()
  self.mock_embed.return_value = [0.1] * 768
  self.mock_structured.return_value = {
   'summary': 'Mocked profile summary',
   'traits': ['Empathetic', 'Communicative'],
   'welcome_message': 'Hello and welcome to Luna!',
   'explanation': 'Shared interests.',
   'categories': ['harmless'],
   'threat': False,
   'reply': 'Mocked AI reply',
   'draft': 'Mocked introduction draft',
   'score_adjustment': 2,
   'reasons': ['Shared values'],
   'venues': [{'name': 'Central Cafe', 'address': 'City Square', 'reason': 'Safe spot'}],
   'is_disrespectful': False,
   'settle_comment': 'Please stay respectful.'
  }
 def tearDown(self):
  self.structured_patcher.stop()
  self.embed_patcher.stop()
 def test_onboarding_updates_owned_profile(self):
  response=self.client.patch('/api/profiles/me/',{'display_name':'Amani','values':['Kindness'],'interests':['Hiking'],'communication_style':'Thoughtful & direct','ai_profile_consent':True,'onboarding_complete':True},format='json')
  self.assertEqual(response.status_code,200);self.user.profile.refresh_from_db();self.assertTrue(self.user.profile.onboarding_complete);self.assertTrue(self.user.profile.ai_profile_consent)
 def test_accept_creates_conversation_with_ai_off(self):
  match=Match.objects.create(requester=self.user.profile,candidate=self.other.profile,score=90,reasons=['Shared values'])
  response=self.client.post(f'/api/matches/{match.id}/accept/')
  self.assertEqual(response.status_code,200);conversation=Conversation.objects.get();self.assertFalse(conversation.ai_enabled);self.assertEqual(conversation.participants.count(),2)
 def test_pass_hides_suggestion(self):
  match=Match.objects.create(requester=self.user.profile,candidate=self.other.profile,score=70)
  response=self.client.post(f'/api/matches/{match.id}/pass/')
  self.assertEqual(response.status_code,200);match.refresh_from_db();self.assertEqual(match.status,'passed')
 def test_ai_requires_every_participant(self):
  conversation=Conversation.objects.create(title='Amani & Amara');conversation.participants.add(self.user.profile,self.other.profile)
  first=self.client.post(f'/api/conversations/{conversation.id}/ai-consent/',{'enabled':True},format='json');self.assertFalse(first.data['ai_enabled'])
  self.client.force_authenticate(self.other);second=self.client.post(f'/api/conversations/{conversation.id}/ai-consent/',{'enabled':True},format='json');self.assertTrue(second.data['ai_enabled']);self.assertEqual(Consent.objects.filter(ai_assistance=True).count(),2)
 def test_gemini_introduction_requires_review_before_send(self):
  conversation=Conversation.objects.create(title='Amani & Amara',ai_enabled=True);conversation.participants.add(self.user.profile,self.other.profile);Consent.objects.create(conversation=conversation,profile=self.user.profile,ai_assistance=True);Consent.objects.create(conversation=conversation,profile=self.other.profile,ai_assistance=True)
  response=self.client.post(f'/api/conversations/{conversation.id}/introduction/')
  self.assertEqual(response.status_code,202);draft=IntroductionDraft.objects.get();self.assertEqual(draft.status,'draft');self.assertEqual(Message.objects.filter(conversation=conversation).count(),0)
  approved=self.client.post(f'/api/conversations/{conversation.id}/introduction/{draft.id}/approve/',{'body':'Hello Amara — photography seems like a great place to start.'},format='json')
  self.assertEqual(approved.status_code,201);self.assertEqual(Message.objects.filter(conversation=conversation).count(),1);draft.refresh_from_db();self.assertEqual(draft.status,'sent')
 def test_block_removes_match_and_conversation_access(self):
  match=Match.objects.create(requester=self.user.profile,candidate=self.other.profile,score=80);conversation=Conversation.objects.create(title='Amani & Amara');conversation.participants.add(self.user.profile,self.other.profile);match.conversation=conversation;match.save()
  blocked=self.client.post('/api/profiles/safety/block/',{'profile_id':self.other.profile.id},format='json');self.assertEqual(blocked.status_code,201);self.assertTrue(Block.objects.filter(blocker=self.user.profile,blocked=self.other.profile).exists())
  self.assertEqual(self.client.get('/api/matches/').data['count'],0)
  conversations_response = self.client.get('/api/conversations/')
  self.assertEqual(conversations_response.data['count'],1)
  self.assertTrue(conversations_response.data['results'][0]['is_luna'])
 def test_report_is_private_and_recorded(self):
  response=self.client.post('/api/profiles/safety/report/',{'profile_id':self.other.profile.id,'reason':'harassment','details':'Repeated unwanted messages'},format='json');self.assertEqual(response.status_code,201);self.assertEqual(Report.objects.get().reporter,self.user.profile)
 def test_revoking_conversation_ai_discards_draft(self):
  conversation=Conversation.objects.create(title='Amani & Amara',ai_enabled=True);conversation.participants.add(self.user.profile,self.other.profile);Consent.objects.create(conversation=conversation,profile=self.user.profile,ai_assistance=True);draft=IntroductionDraft.objects.create(conversation=conversation,requested_by=self.user.profile,status='draft',body='Draft')
  response=self.client.post(f'/api/conversations/{conversation.id}/ai-consent/',{'enabled':False},format='json');self.assertEqual(response.status_code,200);draft.refresh_from_db();self.assertEqual(draft.status,'discarded')
 def test_export_and_password_protected_deletion(self):
  exported=self.client.get('/api/profiles/me/export/');self.assertEqual(exported.status_code,200);self.assertIn('profile',exported.data)
  rejected=self.client.delete('/api/profiles/me/account/',{'password':'wrong'},format='json');self.assertEqual(rejected.status_code,400)
 def test_login_uses_httponly_cookie_session(self):
  self.client.force_authenticate(user=None);response=self.client.post('/api/auth/token/',{'username':'amani','password':'strongpass123'},format='json');self.assertEqual(response.status_code,200);self.assertTrue(response.cookies['luna_access']['httponly']);self.assertTrue(response.cookies['luna_refresh']['httponly']);self.assertNotIn('access',response.data)
  session=self.client.get('/api/auth/session/');self.assertEqual(session.status_code,200)
 def test_message_creates_notification_unread_state_and_local_moderation(self):
  conversation=Conversation.objects.create(title='Amani & Amara');conversation.participants.add(self.user.profile,self.other.profile)
  sent=self.client.post(f'/api/conversations/{conversation.id}/messages/',{'body':'I will hurt you'},format='json');self.assertEqual(sent.status_code,201);self.assertTrue(Notification.objects.filter(profile=self.other.profile).exists());self.assertIn('threat',ModerationEvent.objects.get(message_id=sent.data['id']).categories)
  self.client.force_authenticate(self.other);listing=self.client.get('/api/conversations/')
  conversation_data = next(c for c in listing.data['results'] if c['id'] == conversation.id)
  self.assertEqual(conversation_data['unread_count'], 1)
  self.client.post(f'/api/conversations/{conversation.id}/read/')
  listing=self.client.get('/api/conversations/')
  conversation_data = next(c for c in listing.data['results'] if c['id'] == conversation.id)
  self.assertEqual(conversation_data['unread_count'], 0)
 def test_match_feedback_is_saved_as_learning_signal(self):
  match=Match.objects.create(requester=self.user.profile,candidate=self.other.profile,score=82,status='accepted');response=self.client.post(f'/api/matches/{match.id}/feedback/',{'outcome':'great_conversation','notes':'Easy, balanced exchange'},format='json');self.assertEqual(response.status_code,200);self.assertEqual(MatchFeedback.objects.get().outcome,'great_conversation')
 def test_registration_requires_adult_and_community_consent(self):
  self.client.force_authenticate(user=None);rejected=self.client.post('/api/auth/register/',{'username':'minor','email':'minor@example.com','password':'strongpass123','first_name':'Minor','is_18_or_older':False,'accept_terms':True,'accept_guidelines':True},format='json');self.assertEqual(rejected.status_code,400)
  accepted=self.client.post('/api/auth/register/',{'username':'pilot','email':'pilot@example.com','password':'strongpass123','first_name':'Pilot','phone_number':'+254712345678','is_18_or_older':True,'accept_terms':True,'accept_guidelines':True},format='json');self.assertEqual(accepted.status_code,201);self.assertTrue(User.objects.get(username='pilot').profile.is_18_or_older)
 def test_health_is_public_and_moderation_is_admin_only(self):
  self.client.force_authenticate(user=None);self.assertEqual(self.client.get('/health/').status_code,200);self.assertEqual(self.client.get('/api/moderation/reports/').status_code,401)
  admin=User.objects.create_superuser('moderator','moderator@example.com','strongpass123');self.client.force_authenticate(admin);self.assertEqual(self.client.get('/api/moderation/reports/').status_code,200);self.assertEqual(self.client.get('/api/ops/metrics/').status_code,200)
 def test_phone_verification_and_password_reset(self):
  from .sms import issue_code
  profile=self.user.profile;profile.phone_number='+254700000001';profile.save(update_fields=['phone_number'])
  code=issue_code(profile,'verify');verified=self.client.post('/api/auth/phone/confirm/',{'code':code},format='json');self.assertEqual(verified.status_code,200);profile.refresh_from_db();self.assertTrue(profile.phone_verified)
  reset_code=issue_code(profile,'reset');self.client.force_authenticate(user=None);reset=self.client.post('/api/auth/password-reset/confirm/',{'phone_number':profile.phone_number,'code':reset_code,'new_password':'newstrongpass123'},format='json');self.assertEqual(reset.status_code,200);self.user.refresh_from_db();self.assertTrue(self.user.check_password('newstrongpass123'))
 def test_luna_inbox_reveals_one_profile_before_introduction(self):
  inbox=Conversation.objects.create(title='Luna',is_luna=True,luna_stage='offered');inbox.participants.add(self.user.profile);match=Match.objects.create(requester=self.user.profile,candidate=self.other.profile,score=88,reasons=['Shared values']);inbox.pending_match=match;inbox.save(update_fields=['pending_match'])
  shown=self.client.post(f'/api/conversations/{inbox.id}/messages/',{'body':'Yes, show me their profile'},format='json');self.assertEqual(shown.status_code,201);self.assertEqual(shown.data['luna_reply']['metadata']['type'],'profile_card');self.assertEqual(shown.data['luna_reply']['metadata']['profile']['display_name'],self.other.profile.display_name)
  introduced=self.client.post(f'/api/conversations/{inbox.id}/messages/',{'body':'invite them and moderate'},format='json')
  self.assertEqual(introduced.status_code,201)
  inbox.refresh_from_db()
  self.assertEqual(inbox.luna_stage,'moderating')
  match.refresh_from_db()
  self.assertEqual(match.status,'accepted')
  self.assertTrue(inbox.participants.filter(pk=self.other.profile.id).exists())
 def test_generate_welcome_message_task(self):
  from .tasks import generate_welcome_message
  conversation=Conversation.objects.create(title='Luna',is_luna=True)
  conversation.participants.add(self.user.profile)
  result=generate_welcome_message.run(self.user.profile.id,conversation.id)
  self.assertEqual(result,'complete')
  self.assertTrue(conversation.messages.filter(is_ai=True).exists())
 def test_concierge_stages_and_reengage_flow(self):
  match=Match.objects.create(requester=self.user.profile,candidate=self.other.profile,score=95,reasons=['Overlap'])
  inbox=Conversation.objects.create(title='Luna',is_luna=True,luna_stage='offered',pending_match=match)
  inbox.participants.add(self.user.profile)
  response = self.client.post(f'/api/conversations/{inbox.id}/messages/', {'body': 'Yes, let’s see.'}, format='json')
  self.assertEqual(response.status_code, 201)
  inbox.refresh_from_db()
  self.assertEqual(inbox.luna_stage, 'discussing')
  response = self.client.post(f'/api/conversations/{inbox.id}/messages/', {'body': 'invite them and leave'}, format='json')
  self.assertEqual(response.status_code, 201)
  inbox.refresh_from_db()
  self.assertEqual(inbox.luna_stage, 'left')
  self.assertTrue(inbox.participants.filter(pk=self.other.profile.id).exists())
  response = self.client.post(f'/api/conversations/{inbox.id}/reengage/')
  self.assertEqual(response.status_code, 200)
  inbox.refresh_from_db()
  self.assertEqual(inbox.luna_stage, 'feedback')
  self.assertFalse(inbox.participants.filter(pk=self.other.profile.id).exists())
 def test_moderation_dispute_settlement_and_suspension(self):
  c=Conversation.objects.create(title='Amani & Amara',is_luna=True,luna_stage='moderating')
  c.participants.add(self.user.profile,self.other.profile)
  from unittest.mock import patch
  with patch('core.views.GeminiProvider') as MockGemini:
   instance = MockGemini.return_value
   instance.configured = True
   instance.structured.return_value = {
    'is_disrespectful': True,
    'settle_comment': 'Please stay calm and respectful.'
   }
   resp1 = self.client.post(f'/api/conversations/{c.id}/messages/', {'body': 'Rude message 1'}, format='json')
   self.assertEqual(resp1.status_code, 201)
   self.assertTrue(ModerationEvent.objects.filter(message__body='Rude message 1', severity='warning').exists())
   self.assertEqual(resp1.data['luna_reply']['body'], 'Please stay calm and respectful.')
   resp2 = self.client.post(f'/api/conversations/{c.id}/messages/', {'body': 'Rude message 2'}, format='json')
   self.assertEqual(resp2.status_code, 201)
   self.user.refresh_from_db()
   self.assertFalse(self.user.is_active)
   c.refresh_from_db()
   self.assertFalse(c.participants.filter(pk=self.user.profile.id).exists())
   self.assertTrue(c.participants.filter(pk=self.other.profile.id).exists())
   self.assertTrue(Report.objects.filter(reported=self.user.profile, reason='harassment').exists())
   self.assertIn('removed the other user', resp2.data['luna_reply']['body'])
 def test_contact_sharing_permission_and_masking(self):
  c=Conversation.objects.create(title='Amani & Amara',is_luna=False)
  c.participants.add(self.user.profile,self.other.profile)
  # 1. Masking active when blocked
  resp1 = self.client.post(f'/api/conversations/{c.id}/messages/', {'body': 'Call me at +254712345678 or email pilot@example.com'}, format='json')
  self.assertEqual(resp1.status_code, 201)
  self.assertIn('[REDACTED CONTACT DETAILS]', resp1.data['body'])
  self.assertNotIn('+254712345678', resp1.data['body'])
  
  # 2. Permit contact details
  permit_resp = self.client.post(f'/api/conversations/{c.id}/permit-contact/')
  self.assertEqual(permit_resp.status_code, 200)
  c.refresh_from_db()
  self.assertTrue(c.is_contact_sharing_allowed)
  
  # 3. Masking inactive after consent
  resp2 = self.client.post(f'/api/conversations/{c.id}/messages/', {'body': 'Call me at +254712345678'}, format='json')
  self.assertEqual(resp2.status_code, 201)
  self.assertIn('+254712345678', resp2.data['body'])
  
 def test_venue_suggestion_and_date_scheduling(self):
  c=Conversation.objects.create(title='Amani & Amara',is_luna=False)
  c.participants.add(self.user.profile,self.other.profile)
  
  # Suggest venues
  suggest_resp = self.client.get(f'/api/conversations/{c.id}/suggest-venues/')
  self.assertEqual(suggest_resp.status_code, 200)
  self.assertTrue(len(suggest_resp.data['venues']) > 0)
  
  # Propose date
  prop_resp = self.client.post(f'/api/conversations/{c.id}/schedule-date/', {
   'proposed_time': '2026-07-20T18:00:00Z',
   'venue_name': 'Connect Coffee',
   'venue_address': 'Chiromo Road'
  }, format='json')
  self.assertEqual(prop_resp.status_code, 200)
  meeting_id = prop_resp.data['meeting_id']
  
  # Respond date
  resp_resp = self.client.post(f'/api/conversations/{c.id}/schedule-date/{meeting_id}/respond/', {'action': 'accept'}, format='json')
  self.assertEqual(resp_resp.status_code, 200)
  self.assertEqual(resp_resp.data['status'], 'accepted')
  
 def test_vector_embeddings_cosine_similarity(self):
  from .tasks import refresh_matches
  p1 = self.user.profile
  p2 = self.other.profile
  
  p1.onboarding_complete = True
  p1.is_discoverable = True
  p1.ai_embedding = [1.0, 0.0, 0.0]
  p1.save()
  
  p2.onboarding_complete = True
  p2.is_discoverable = True
  p2.ai_embedding = [1.0, 0.0, 0.0] # Exactly identical embedding
  p2.save()
  
  refresh_matches(p1.id)
  match1 = Match.objects.get(requester=p1, candidate=p2)
  self.assertEqual(match1.score, 99) # Cosine similarity = 1.0 -> 99 score
  
  p2.ai_embedding = [0.0, 1.0, 0.0] # Orthogonal embedding
  p2.save()
  
  refresh_matches(p1.id)
  match2 = Match.objects.get(requester=p1, candidate=p2)
  self.assertEqual(match2.score, 0) # Cosine similarity = 0.0 -> 0 score
 def test_gender_and_preference_filtering(self):
  from .tasks import refresh_matches
  from django.contrib.auth.models import User
  p1 = self.user.profile
  p1.onboarding_complete = True
  p1.is_discoverable = True
  p1.connection_goal = 'romance'
  p1.gender = 'female'
  p1.gender_preference = 'male'
  p1.save()

  # Candidate 1: Male looking for Women (romance) -> Should Match
  u2 = User.objects.create_user(username='candidate_male', password='pwd')
  p2 = u2.profile
  p2.display_name = 'Male Candidate'
  p2.onboarding_complete = True
  p2.is_discoverable = True
  p2.connection_goal = 'romance'
  p2.gender = 'male'
  p2.gender_preference = 'female'
  p2.save()

  # Candidate 2: Female looking for Men (romance) -> Should NOT match (p1 wants males)
  u3 = User.objects.create_user(username='candidate_female', password='pwd')
  p3 = u3.profile
  p3.display_name = 'Female Candidate'
  p3.onboarding_complete = True
  p3.is_discoverable = True
  p3.connection_goal = 'romance'
  p3.gender = 'female'
  p3.gender_preference = 'male'
  p3.save()

  # Candidate 3: Male looking for Men (romance) -> Should NOT match (p4 wants males, user is female)
  u4 = User.objects.create_user(username='candidate_male_gay', password='pwd')
  p4 = u4.profile
  p4.display_name = 'Gay Male Candidate'
  p4.onboarding_complete = True
  p4.is_discoverable = True
  p4.connection_goal = 'romance'
  p4.gender = 'male'
  p4.gender_preference = 'male'
  p4.save()

  refresh_matches(p1.id)

  self.assertTrue(Match.objects.filter(requester=p1, candidate=p2).exists())
  self.assertFalse(Match.objects.filter(requester=p1, candidate=p3).exists())
  self.assertFalse(Match.objects.filter(requester=p1, candidate=p4).exists())
