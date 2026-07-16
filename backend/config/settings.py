import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
BASE_DIR=Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent/'.env')
load_dotenv(BASE_DIR/'.env')
SECRET_KEY=os.getenv('DJANGO_SECRET_KEY','dev-only-change-me-use-32-plus-characters')
DEBUG=os.getenv('DEBUG','true').lower()=='true'
ALLOWED_HOSTS=os.getenv('ALLOWED_HOSTS','localhost,127.0.0.1').split(',')
INSTALLED_APPS=['daphne','django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','corsheaders','rest_framework','drf_spectacular','channels','core']
MIDDLEWARE=['django.middleware.security.SecurityMiddleware','whitenoise.middleware.WhiteNoiseMiddleware','corsheaders.middleware.CorsMiddleware','django.contrib.sessions.middleware.SessionMiddleware','django.middleware.common.CommonMiddleware','django.middleware.csrf.CsrfViewMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']
ROOT_URLCONF='config.urls';TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','DIRS':[BASE_DIR.parent / 'dist'],'APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION='config.wsgi.application';ASGI_APPLICATION='config.asgi.application'
import sys
if 'test' in sys.argv or os.getenv('USE_SQLITE','true').lower()=='true':
 DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':(BASE_DIR/'data'/'db.sqlite3') if os.path.exists(BASE_DIR/'data') else (BASE_DIR/'db.sqlite3')}}
else:
 DATABASES={'default':{
  'ENGINE':'django.db.backends.mysql',
  'NAME':os.getenv('MYSQL_DATABASE','luna_db'),
  'USER':os.getenv('MYSQL_USER','root'),
  'PASSWORD':os.getenv('MYSQL_PASSWORD',''),
  'HOST':os.getenv('MYSQL_HOST','127.0.0.1'),
  'PORT':os.getenv('MYSQL_PORT','3306'),
  'OPTIONS':{'charset':'utf8mb4','init_command':"SET sql_mode='STRICT_TRANS_TABLES'"},
 }}
AUTH_PASSWORD_VALIDATORS=[];LANGUAGE_CODE='en-us';TIME_ZONE='Africa/Nairobi';USE_I18N=True;USE_TZ=True;STATIC_URL='/static/';MEDIA_URL='/media/';STATICFILES_DIRS=[BASE_DIR.parent / 'dist'];STATIC_ROOT=BASE_DIR / 'staticfiles';STORAGES={"default":{"BACKEND":"django.core.files.storage.FileSystemStorage"},"staticfiles":{"BACKEND":"whitenoise.storage.CompressedManifestStaticFilesStorage"}};DEFAULT_AUTO_FIELD='django.db.models.BigAutoField'
REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES':['core.authentication.CookieJWTAuthentication'],'DEFAULT_PERMISSION_CLASSES':['rest_framework.permissions.IsAuthenticated'],'DEFAULT_SCHEMA_CLASS':'drf_spectacular.openapi.AutoSchema','DEFAULT_PAGINATION_CLASS':'rest_framework.pagination.PageNumberPagination','PAGE_SIZE':20,'EXCEPTION_HANDLER':'core.exceptions.api_exception_handler','DEFAULT_THROTTLE_RATES':{'messages':'30/min','safety':'10/hour'}}
SPECTACULAR_SETTINGS={'TITLE':'Luna API','DESCRIPTION':'Consent-first social intelligence platform API powered by Google Gemini','VERSION':'0.1.0','SERVE_INCLUDE_SCHEMA':False}
SIMPLE_JWT={'ACCESS_TOKEN_LIFETIME':timedelta(minutes=60),'REFRESH_TOKEN_LIFETIME':timedelta(days=7)}
CORS_ALLOWED_ORIGINS=os.getenv('CORS_ALLOWED_ORIGINS','http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS=True
CSRF_TRUSTED_ORIGINS=os.getenv('CSRF_TRUSTED_ORIGINS','http://localhost:5173').split(',')
if not DEBUG and os.getenv('ENABLE_HTTPS','false').lower()=='true':
 SECURE_SSL_REDIRECT=True;SESSION_COOKIE_SECURE=True;CSRF_COOKIE_SECURE=True;SECURE_HSTS_SECONDS=31536000;SECURE_HSTS_INCLUDE_SUBDOMAINS=True;SECURE_HSTS_PRELOAD=True;SECURE_CONTENT_TYPE_NOSNIFF=True
REDIS_URL=os.getenv('REDIS_URL','redis://localhost:6379/0')
# MVP runs directly on Windows without Docker or Redis.
USE_REDIS=False
CHANNEL_LAYERS={'default':{'BACKEND':'channels_redis.core.RedisChannelLayer','CONFIG':{'hosts':[REDIS_URL]}}} if USE_REDIS else {'default':{'BACKEND':'channels.layers.InMemoryChannelLayer'}}
CELERY_BROKER_URL=REDIS_URL;CELERY_RESULT_BACKEND=REDIS_URL;CELERY_TASK_ALWAYS_EAGER=os.getenv('CELERY_EAGER','true').lower()=='true'
CELERY_BEAT_SCHEDULE={'unread-sms-reminders':{'task':'core.tasks.send_unread_sms_reminders','schedule':900.0}}
GEMINI_API_KEY=os.getenv('GEMINI_API_KEY','')
GEMINI_BASE_URL=os.getenv('GEMINI_BASE_URL','https://generativelanguage.googleapis.com/v1beta')
GEMINI_MODEL=os.getenv('GEMINI_MODEL','gemini-3.1-flash-lite')
GEMINI_TIMEOUT=int(os.getenv('GEMINI_TIMEOUT','30'))
AFRICASTALKING_USERNAME=os.getenv('AFRICASTALKING_USERNAME','')
AFRICASTALKING_API_KEY=os.getenv('AFRICASTALKING_API_KEY','')
AFRICASTALKING_SENDER_ID=os.getenv('AFRICASTALKING_SENDER_ID','')
AFRICASTALKING_SMS_URL=os.getenv('AFRICASTALKING_SMS_URL','https://api.sandbox.africastalking.com/version1/messaging')
AFRICASTALKING_TIMEOUT=int(os.getenv('AFRICASTALKING_TIMEOUT','15'))
TERMS_VERSION=os.getenv('TERMS_VERSION','2026-07')
LOGGING={'version':1,'disable_existing_loggers':False,'formatters':{'json':{'()':'core.logging.JsonFormatter'}},'handlers':{'console':{'class':'logging.StreamHandler','formatter':'json'}},'loggers':{'django.request':{'handlers':['console'],'level':os.getenv('LOG_LEVEL','INFO'),'propagate':False},'core':{'handlers':['console'],'level':os.getenv('LOG_LEVEL','INFO'),'propagate':False}}}
