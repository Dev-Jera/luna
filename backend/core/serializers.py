from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from .models import Consent,Conversation,IntroductionDraft,Match,Message,Notification,Profile,Report,CounselingSession
class UserSerializer(serializers.ModelSerializer):
 class Meta:model=User;fields=['id','username','first_name','email','is_staff']
class ProfileSerializer(serializers.ModelSerializer):
 user=UserSerializer(read_only=True)
 class Meta:model=Profile;fields=['id','user','display_name','bio','location','phone_number','phone_verified','sms_match_notifications','sms_unread_reminders','sms_safety_alerts','connection_goal','values','interests','communication_style','life_goals','lifestyle','deal_breakers','gender','gender_preference','is_discoverable','is_18_or_older','terms_version','terms_accepted_at','guidelines_accepted_at','ai_profile_consent','ai_summary','ai_traits','ai_analysis_status','onboarding_complete','is_premium','profile_picture'];read_only_fields=['phone_number','phone_verified','is_18_or_older','terms_version','terms_accepted_at','guidelines_accepted_at','ai_summary','ai_traits','ai_analysis_status','is_premium']
class MessageSerializer(serializers.ModelSerializer):
 sender=UserSerializer(read_only=True)
 class Meta:model=Message;fields=['id','sender','body','is_ai','metadata','created_at']
class ConversationSerializer(serializers.ModelSerializer):
 participants=ProfileSerializer(many=True,read_only=True);messages=serializers.SerializerMethodField();my_ai_consent=serializers.SerializerMethodField();unread_count=serializers.SerializerMethodField()
 class Meta:model=Conversation;fields=['id','title','participants','is_luna','luna_stage','ai_enabled','my_ai_consent','unread_count','is_contact_sharing_allowed','luna_board','messages']
 def get_messages(self, obj):
  request = self.context.get('request')
  qs = obj.messages.all()
  if request and hasattr(request.user, 'profile'):
   profile_id = request.user.profile.id
   qs = [m for m in qs if not m.metadata or m.metadata.get('visible_to_profile_id') is None or m.metadata.get('visible_to_profile_id') == profile_id]
  return MessageSerializer(qs, many=True, context=self.context).data
 def get_my_ai_consent(self,obj)->bool:
  request=self.context.get('request')
  return bool(request and Consent.objects.filter(conversation=obj,profile__user=request.user,ai_assistance=True).exists())
 def get_unread_count(self,obj)->int:
  request=self.context.get('request')
  if not request:return 0
  state=obj.read_states.filter(profile__user=request.user).first()
  if not state:return obj.messages.exclude(sender=request.user).count()
  # Filter unread messages query using the same visible_to check
  visible_msgs = [m for m in obj.messages.all() if not m.metadata or m.metadata.get('visible_to_profile_id') is None or m.metadata.get('visible_to_profile_id') == request.user.profile.id]
  return sum(1 for m in visible_msgs if m.sender != request.user and m.created_at > state.last_read_at)
class MatchSerializer(serializers.ModelSerializer):
 profile=ProfileSerializer(source='candidate',read_only=True);conversation_id=serializers.IntegerField(source='conversation.id',read_only=True)
 class Meta:model=Match;fields=['id','profile','score','reasons','ai_explanation','status','conversation_id']
class IntroductionDraftSerializer(serializers.ModelSerializer):
 class Meta:model=IntroductionDraft;fields=['id','conversation','body','status','created_at'];read_only_fields=['conversation','status','created_at']
class NotificationSerializer(serializers.ModelSerializer):
 class Meta:model=Notification;fields=['id','conversation','kind','title','body','read_at','created_at']
class ReportSerializer(serializers.ModelSerializer):
 reporter_name=serializers.CharField(source='reporter.display_name',read_only=True);reported_name=serializers.CharField(source='reported.display_name',read_only=True)
 class Meta:model=Report;fields=['id','reporter_name','reported_name','conversation','reason','details','status','resolution_notes','created_at','reviewed_at'];read_only_fields=['reporter_name','reported_name','conversation','reason','details','created_at','reviewed_at']
class RegisterSerializer(serializers.ModelSerializer):
 password=serializers.CharField(write_only=True,min_length=8);phone_number=serializers.CharField(write_only=True);is_18_or_older=serializers.BooleanField(write_only=True);accept_terms=serializers.BooleanField(write_only=True);accept_guidelines=serializers.BooleanField(write_only=True)
 class Meta:model=User;fields=['username','email','password','first_name','phone_number','is_18_or_older','accept_terms','accept_guidelines']
 def validate(self,data):
  if not data.get('is_18_or_older'):raise serializers.ValidationError({'is_18_or_older':'Luna is currently available only to adults 18 and older.'})
  if not data.get('accept_terms') or not data.get('accept_guidelines'):raise serializers.ValidationError({'consent':'Terms and community guidelines must be accepted.'})
  from .sms import normalize_phone
  try:data['phone_number']=normalize_phone(data.get('phone_number'))
  except ValueError as exc:raise serializers.ValidationError({'phone_number':str(exc)}) from exc
  if Profile.objects.filter(phone_number=data['phone_number']).exists():raise serializers.ValidationError({'phone_number':'This phone number is already registered.'})
  return data
 @transaction.atomic
 def create(self,data):
  from django.conf import settings
  from django.utils import timezone
  from .task_dispatch import dispatch
  from .tasks import generate_welcome_message
  age=data.pop('is_18_or_older');phone=data.pop('phone_number');data.pop('accept_terms');data.pop('accept_guidelines');user=User.objects.create_user(**data);profile=user.profile;profile.phone_number=phone;profile.is_18_or_older=age;profile.terms_version=settings.TERMS_VERSION;profile.terms_accepted_at=timezone.now();profile.guidelines_accepted_at=timezone.now();profile.save();conversation=Conversation.objects.create(title='Luna',is_luna=True);conversation.participants.add(profile)
  transaction.on_commit(lambda: dispatch(generate_welcome_message,profile.id,conversation.id))
  return user

class CounselingSessionSerializer(serializers.ModelSerializer):
 class Meta:
  model=CounselingSession
  fields=['id','partner_name','partner_phone','scheduled_time','meeting_link','status','created_at']
  read_only_fields=['meeting_link','status','created_at']

