from django.core.cache import cache
from django.db import connection
from django.db.models import Count
from django.utils import timezone
from rest_framework import permissions,status,viewsets
from rest_framework.decorators import action,api_view,permission_classes
from rest_framework.response import Response
from .models import AuditEvent,Conversation,Match,Message,Profile,Report
from .serializers import ReportSerializer
from drf_spectacular.utils import extend_schema,inline_serializer
from rest_framework import serializers

@extend_schema(responses={200:inline_serializer('Health',fields={'status':serializers.CharField(),'service':serializers.CharField(),'time':serializers.DateTimeField()})})
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health(request):return Response({'status':'ok','service':'luna','time':timezone.now()})
@extend_schema(responses={200:inline_serializer('Readiness',fields={'status':serializers.CharField(),'database':serializers.BooleanField(),'cache':serializers.BooleanField()})})
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def readiness(request):
 try:
  with connection.cursor() as cursor:cursor.execute('SELECT 1');cursor.fetchone()
  cache.set('luna_readiness','ok',10);cache_ok=cache.get('luna_readiness')=='ok'
  return Response({'status':'ready','database':True,'cache':cache_ok})
 except Exception as exc:return Response({'status':'not_ready'},status=status.HTTP_503_SERVICE_UNAVAILABLE)
@extend_schema(responses={200:inline_serializer('OperationalMetrics',fields={'profiles':serializers.IntegerField(),'onboarded_profiles':serializers.IntegerField(),'suggested_matches':serializers.IntegerField(),'accepted_matches':serializers.IntegerField(),'conversations':serializers.IntegerField(),'messages':serializers.IntegerField(),'open_reports':serializers.IntegerField()})})
@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def metrics(request):
 return Response({'profiles':Profile.objects.count(),'onboarded_profiles':Profile.objects.filter(onboarding_complete=True).count(),'suggested_matches':Match.objects.filter(status='suggested').count(),'accepted_matches':Match.objects.filter(status='accepted').count(),'conversations':Conversation.objects.count(),'messages':Message.objects.count(),'open_reports':Report.objects.filter(status__in=['open','reviewing']).count()})
class ModerationViewSet(viewsets.ReadOnlyModelViewSet):
 permission_classes=[permissions.IsAdminUser];serializer_class=ReportSerializer;queryset=Report.objects.none()
 def get_queryset(self):return Report.objects.select_related('reporter','reported').order_by('created_at')
 @action(detail=True,methods=['post'])
 def resolve(self,request,pk=None):
  report=self.get_object();new_status=request.data.get('status')
  if new_status not in ['reviewing','resolved','dismissed']:return Response({'status':['Choose reviewing, resolved, or dismissed.']},status=status.HTTP_400_BAD_REQUEST)
  report.status=new_status;report.resolution_notes=str(request.data.get('resolution_notes',''))[:1000];report.reviewed_by=request.user;report.reviewed_at=timezone.now();report.save();AuditEvent.objects.create(actor=getattr(request.user,'profile',None),event='report.reviewed',target_type='report',target_id=report.id,metadata={'status':new_status});return Response(self.get_serializer(report).data)
 @action(detail=False,methods=['get'],url_path='users')
 def list_users(self,request):
  profiles=Profile.objects.select_related('user').all()
  data=[]
  for p in profiles:
   data.append({'id':p.id,'username':p.user.username,'display_name':p.display_name,'email':p.user.email,'phone_number':p.phone_number,'is_active':p.user.is_active,'onboarding_complete':p.onboarding_complete})
  return Response(data)
 @action(detail=False,methods=['post'],url_path=r'users/(?P<profile_id>\d+)/suspend')
 def toggle_suspend(self,request,profile_id=None):
  profile=Profile.objects.filter(pk=profile_id).select_related('user').first()
  if not profile:return Response({'detail':'Profile not found.'},status=status.HTTP_404_NOT_FOUND)
  u=profile.user;u.is_active=not u.is_active;u.save(update_fields=['is_active'])
  return Response({'id':profile.id,'username':u.username,'is_active':u.is_active})

