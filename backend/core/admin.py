from django.contrib import admin
from .models import AuditEvent,Block,Consent,Conversation,ConversationReadState,IntroductionDraft,Match,MatchFeedback,Message,ModerationEvent,Notification,Profile,Report
admin.site.register([Profile,Match,Conversation,Message,Consent,IntroductionDraft,Block,Report,ConversationReadState,Notification,ModerationEvent,AuditEvent,MatchFeedback])
