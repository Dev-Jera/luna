from django.urls import include,path
from rest_framework.routers import DefaultRouter
from .views import ConfirmPhoneVerificationView,ConversationViewSet,MatchViewSet,NotificationViewSet,PasswordResetConfirmView,PasswordResetRequestView,ProfileViewSet,RegisterView,SendPhoneVerificationView
from .ops_views import ModerationViewSet
router=DefaultRouter();router.register('profiles',ProfileViewSet,basename='profile');router.register('matches',MatchViewSet,basename='match');router.register('conversations',ConversationViewSet,basename='conversation');router.register('notifications',NotificationViewSet,basename='notification');router.register('moderation/reports',ModerationViewSet,basename='moderation-report')
urlpatterns=[path('auth/register/',RegisterView.as_view()),path('auth/phone/send/',SendPhoneVerificationView.as_view()),path('auth/phone/confirm/',ConfirmPhoneVerificationView.as_view()),path('auth/password-reset/request/',PasswordResetRequestView.as_view()),path('auth/password-reset/confirm/',PasswordResetConfirmView.as_view()),path('',include(router.urls))]
