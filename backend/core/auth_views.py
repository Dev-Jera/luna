from django.conf import settings
from rest_framework import permissions,status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema,inline_serializer
from rest_framework import serializers

def cookie_options():return {'httponly':True,'secure':getattr(settings,'SESSION_COOKIE_SECURE',False),'samesite':'Strict','path':'/'}
def set_tokens(response,access,refresh=None):
 response.set_cookie('luna_access',str(access),max_age=int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),**cookie_options())
 if refresh:response.set_cookie('luna_refresh',str(refresh),max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),**cookie_options())
 return response

class CookieTokenView(APIView):
 permission_classes=[permissions.AllowAny];authentication_classes=[]
 @extend_schema(request=inline_serializer('LoginRequest',fields={'username':serializers.CharField(),'password':serializers.CharField()}),responses={200:inline_serializer('AuthStatus',fields={'authenticated':serializers.BooleanField()})})
 def post(self,request):
  serializer=TokenObtainPairSerializer(data=request.data);serializer.is_valid(raise_exception=True);tokens=serializer.validated_data
  return set_tokens(Response({'authenticated':True}),tokens['access'],tokens['refresh'])
class CookieRefreshView(APIView):
 permission_classes=[permissions.AllowAny];authentication_classes=[]
 @extend_schema(request=None,responses={200:inline_serializer('RefreshStatus',fields={'authenticated':serializers.BooleanField()})})
 def post(self,request):
  raw=request.COOKIES.get('luna_refresh')
  if not raw:return Response({'detail':'No refresh session.'},status=status.HTTP_401_UNAUTHORIZED)
  try:refresh=RefreshToken(raw);access=refresh.access_token
  except Exception:return Response({'detail':'Session expired.'},status=status.HTTP_401_UNAUTHORIZED)
  return set_tokens(Response({'authenticated':True}),access)
class LogoutView(APIView):
 @extend_schema(request=None,responses={204:None})
 def post(self,request):
  response=Response(status=status.HTTP_204_NO_CONTENT);response.delete_cookie('luna_access',path='/');response.delete_cookie('luna_refresh',path='/');return response
class SessionView(APIView):
 @extend_schema(responses={200:inline_serializer('SessionStatus',fields={'authenticated':serializers.BooleanField(),'user_id':serializers.IntegerField()})})
 def get(self,request):return Response({'authenticated':True,'user_id':request.user.id})
