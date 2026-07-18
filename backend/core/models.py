from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
class Profile(models.Model):
 GOALS=[('friendship','Friendship'),('romance','Romance'),('networking','Networking')]
 user=models.OneToOneField(User,on_delete=models.CASCADE,related_name='profile');display_name=models.CharField(max_length=80,blank=True);bio=models.TextField(blank=True);location=models.CharField(max_length=120,blank=True);phone_number=models.CharField(max_length=20,blank=True,unique=True,null=True);phone_verified=models.BooleanField(default=False);sms_match_notifications=models.BooleanField(default=False);sms_unread_reminders=models.BooleanField(default=False);sms_safety_alerts=models.BooleanField(default=True);connection_goal=models.CharField(max_length=20,choices=GOALS,default='friendship');values=models.JSONField(default=list,blank=True);interests=models.JSONField(default=list,blank=True);communication_style=models.CharField(max_length=120,blank=True);life_goals=models.JSONField(default=list,blank=True);lifestyle=models.JSONField(default=list,blank=True);deal_breakers=models.JSONField(default=list,blank=True);gender=models.CharField(max_length=20,choices=[('male','Man'),('female','Woman'),('other','Other')],default='other',blank=True);gender_preference=models.CharField(max_length=20,choices=[('male','Men'),('female','Women'),('both','Everyone')],default='both',blank=True);is_discoverable=models.BooleanField(default=True);is_18_or_older=models.BooleanField(default=False);terms_version=models.CharField(max_length=20,blank=True);terms_accepted_at=models.DateTimeField(null=True,blank=True);guidelines_accepted_at=models.DateTimeField(null=True,blank=True);ai_profile_consent=models.BooleanField(default=False);ai_summary=models.TextField(blank=True);ai_traits=models.JSONField(default=list,blank=True);ai_analysis_status=models.CharField(max_length=20,default='not_requested');onboarding_complete=models.BooleanField(default=False);ai_embedding=models.JSONField(null=True,blank=True);is_premium=models.BooleanField(default=False);profile_picture=models.TextField(blank=True);created_at=models.DateTimeField(auto_now_add=True);updated_at=models.DateTimeField(auto_now=True)
 def __str__(self):return self.display_name or self.user.username
class Conversation(models.Model):
 title=models.CharField(max_length=160,blank=True);participants=models.ManyToManyField(Profile,related_name='conversations');is_luna=models.BooleanField(default=False);luna_stage=models.CharField(max_length=24,default='welcome');pending_match=models.ForeignKey('Match',null=True,blank=True,on_delete=models.SET_NULL,related_name='luna_inboxes');ai_enabled=models.BooleanField(default=False);is_contact_sharing_allowed=models.BooleanField(default=False);is_counseling=models.BooleanField(default=False);created_at=models.DateTimeField(auto_now_add=True)
class Match(models.Model):
 STATUSES=[('suggested','Suggested'),('accepted','Accepted'),('passed','Passed')]
 requester=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='matches_requested');candidate=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='matches_received');score=models.PositiveSmallIntegerField(default=0);reasons=models.JSONField(default=list);ai_explanation=models.TextField(blank=True);status=models.CharField(max_length=20,choices=STATUSES,default='suggested');presented_at=models.DateTimeField(null=True,blank=True);conversation=models.ForeignKey(Conversation,null=True,blank=True,on_delete=models.SET_NULL,related_name='human_matches');created_at=models.DateTimeField(auto_now_add=True)
 class Meta:constraints=[models.UniqueConstraint(fields=['requester','candidate'],name='unique_match_direction')];ordering=['-score']
class Message(models.Model):
 conversation=models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name='messages');sender=models.ForeignKey(User,null=True,blank=True,on_delete=models.SET_NULL);body=models.TextField();is_ai=models.BooleanField(default=False);metadata=models.JSONField(default=dict,blank=True);created_at=models.DateTimeField(auto_now_add=True)
 class Meta:ordering=['created_at']
class Consent(models.Model):
 profile=models.ForeignKey(Profile,on_delete=models.CASCADE);conversation=models.ForeignKey(Conversation,on_delete=models.CASCADE);ai_assistance=models.BooleanField(default=False);updated_at=models.DateTimeField(auto_now=True)
 class Meta:constraints=[models.UniqueConstraint(fields=['profile','conversation'],name='unique_conversation_consent')]
class IntroductionDraft(models.Model):
 STATUSES=[('generating','Generating'),('draft','Draft'),('sent','Sent'),('discarded','Discarded'),('failed','Failed')]
 conversation=models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name='introduction_drafts');requested_by=models.ForeignKey(Profile,on_delete=models.CASCADE);body=models.TextField(blank=True);status=models.CharField(max_length=20,choices=STATUSES,default='generating');created_at=models.DateTimeField(auto_now_add=True);updated_at=models.DateTimeField(auto_now=True)
class Block(models.Model):
 blocker=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='blocks_made');blocked=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='blocks_received');created_at=models.DateTimeField(auto_now_add=True)
 class Meta:constraints=[models.UniqueConstraint(fields=['blocker','blocked'],name='unique_profile_block')]
class Report(models.Model):
 REASONS=[('harassment','Harassment'),('spam','Spam'),('impersonation','Impersonation'),('unsafe','Unsafe behavior'),('other','Other')]
 reporter=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='reports_made');reported=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='reports_received');conversation=models.ForeignKey(Conversation,null=True,blank=True,on_delete=models.SET_NULL);reason=models.CharField(max_length=30,choices=REASONS);details=models.TextField(blank=True,max_length=1000);status=models.CharField(max_length=20,default='open',choices=[('open','Open'),('reviewing','Reviewing'),('resolved','Resolved'),('dismissed','Dismissed')]);resolution_notes=models.TextField(blank=True,max_length=1000);reviewed_by=models.ForeignKey(User,null=True,blank=True,on_delete=models.SET_NULL,related_name='reports_reviewed');created_at=models.DateTimeField(auto_now_add=True);reviewed_at=models.DateTimeField(null=True,blank=True)
class ConversationReadState(models.Model):
 conversation=models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name='read_states');profile=models.ForeignKey(Profile,on_delete=models.CASCADE);last_read_at=models.DateTimeField(auto_now_add=True)
 class Meta:constraints=[models.UniqueConstraint(fields=['conversation','profile'],name='unique_conversation_read_state')]
class Notification(models.Model):
 profile=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='notifications');conversation=models.ForeignKey(Conversation,null=True,blank=True,on_delete=models.CASCADE);kind=models.CharField(max_length=30,default='message');title=models.CharField(max_length=160);body=models.CharField(max_length=240,blank=True);read_at=models.DateTimeField(null=True,blank=True);sms_sent_at=models.DateTimeField(null=True,blank=True);created_at=models.DateTimeField(auto_now_add=True)
 class Meta:ordering=['-created_at']
class ModerationEvent(models.Model):
 message=models.OneToOneField(Message,on_delete=models.CASCADE,related_name='moderation_event');categories=models.JSONField(default=list);severity=models.CharField(max_length=20,default='review');created_at=models.DateTimeField(auto_now_add=True)
class AuditEvent(models.Model):
 actor=models.ForeignKey(Profile,null=True,blank=True,on_delete=models.SET_NULL);event=models.CharField(max_length=80);target_type=models.CharField(max_length=40,blank=True);target_id=models.PositiveBigIntegerField(null=True,blank=True);metadata=models.JSONField(default=dict,blank=True);created_at=models.DateTimeField(auto_now_add=True)
 class Meta:ordering=['-created_at']
class MatchFeedback(models.Model):
 OUTCOMES=[('good_fit','Good fit'),('not_aligned','Not aligned'),('great_conversation','Great conversation'),('no_response','No response')]
 match=models.ForeignKey(Match,on_delete=models.CASCADE,related_name='feedback');profile=models.ForeignKey(Profile,on_delete=models.CASCADE);outcome=models.CharField(max_length=30,choices=OUTCOMES);notes=models.CharField(max_length=500,blank=True);created_at=models.DateTimeField(auto_now_add=True)
 class Meta:constraints=[models.UniqueConstraint(fields=['match','profile'],name='unique_match_feedback')]
class PhoneCode(models.Model):
 PURPOSES=[('verify','Verify phone'),('reset','Reset password')]
 profile=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='phone_codes');purpose=models.CharField(max_length=12,choices=PURPOSES);code_hash=models.CharField(max_length=128);expires_at=models.DateTimeField();attempts=models.PositiveSmallIntegerField(default=0);used_at=models.DateTimeField(null=True,blank=True);created_at=models.DateTimeField(auto_now_add=True)
 class Meta:ordering=['-created_at']
 @property
 def usable(self):return self.used_at is None and self.expires_at>timezone.now() and self.attempts<5

class DateMeeting(models.Model):
 STATUSES=[('proposed','Proposed'),('accepted','Accepted'),('declined','Declined')]
 conversation=models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name='date_meetings')
 proposer=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='proposed_dates')
 proposed_time=models.DateTimeField()
 venue_name=models.CharField(max_length=160)
 venue_address=models.CharField(max_length=240)
 status=models.CharField(max_length=20,choices=STATUSES,default='proposed')
 created_at=models.DateTimeField(auto_now_add=True)
 class Meta:ordering=['-created_at']

class CounselingSession(models.Model):
 STATUSES=[('scheduled','Scheduled'),('completed','Completed'),('cancelled','Cancelled')]
 client=models.ForeignKey(Profile,on_delete=models.CASCADE,related_name='sessions_client')
 partner_name=models.CharField(max_length=120,blank=True)
 partner_phone=models.CharField(max_length=20,blank=True)
 scheduled_time=models.DateTimeField()
 meeting_link=models.URLField(blank=True)
 status=models.CharField(max_length=20,choices=STATUSES,default='scheduled')
 created_at=models.DateTimeField(auto_now_add=True)
 class Meta:ordering=['-scheduled_time']

class PremiumPayment(models.Model):
 STATUS_CHOICES = [
  ('initiated', 'Initiated'),
  ('processing', 'Processing'),
  ('successful', 'Successful'),
  ('failed', 'Failed'),
  ('cancelled', 'Cancelled'),
 ]
 profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='premium_payments')
 reference = models.UUIDField(unique=True)
 amount = models.IntegerField()
 currency = models.CharField(max_length=3, default='UGX')
 status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
 created_at = models.DateTimeField(auto_now_add=True)
 updated_at = models.DateTimeField(auto_now=True)

 class Meta:
  ordering = ['-created_at']
