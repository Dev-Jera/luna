from django.contrib import admin
from django.urls import include,path,re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from core.auth_views import CookieRefreshView,CookieTokenView,LogoutView,SessionView
from core.ops_views import health,metrics,readiness
from drf_spectacular.views import SpectacularAPIView,SpectacularSwaggerView

dist_root = settings.BASE_DIR.parent / 'dist'

urlpatterns=[
    path('admin/',admin.site.urls),
    path('health/',health),
    path('ready/',readiness),
    path('api/ops/metrics/',metrics),
    path('api/schema/',SpectacularAPIView.as_view(),name='schema'),
    path('api/docs/',SpectacularSwaggerView.as_view(url_name='schema'),name='swagger-ui'),
    path('api/auth/token/',CookieTokenView.as_view()),
    path('api/auth/token/refresh/',CookieRefreshView.as_view()),
    path('api/auth/logout/',LogoutView.as_view()),
    path('api/auth/session/',SessionView.as_view()),
    path('api/',include('core.urls')),
    path('sw.js', serve, {'document_root': dist_root, 'path': 'sw.js'}),
    path('manifest.json', serve, {'document_root': dist_root, 'path': 'manifest.json'}),
    path('icon-192.png', serve, {'document_root': dist_root, 'path': 'icon-192.png'}),
    path('icon-512.png', serve, {'document_root': dist_root, 'path': 'icon-512.png'}),
    re_path(r'^.*$',TemplateView.as_view(template_name='index.html'))
]
