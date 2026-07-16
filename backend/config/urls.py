from django.contrib import admin
from django.urls import include,path
from core.auth_views import CookieRefreshView,CookieTokenView,LogoutView,SessionView
from core.ops_views import health,metrics,readiness
from drf_spectacular.views import SpectacularAPIView,SpectacularSwaggerView
urlpatterns=[path('admin/',admin.site.urls),path('health/',health),path('ready/',readiness),path('api/ops/metrics/',metrics),path('api/schema/',SpectacularAPIView.as_view(),name='schema'),path('api/docs/',SpectacularSwaggerView.as_view(url_name='schema'),name='swagger-ui'),path('api/auth/token/',CookieTokenView.as_view()),path('api/auth/token/refresh/',CookieRefreshView.as_view()),path('api/auth/logout/',LogoutView.as_view()),path('api/auth/session/',SessionView.as_view()),path('api/',include('core.urls'))]
