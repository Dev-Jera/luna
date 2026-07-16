from drf_spectacular.extensions import OpenApiAuthenticationExtension
class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
 target_class='core.authentication.CookieJWTAuthentication';name='cookieJwt'
 def get_security_definition(self,auto_schema):return {'type':'apiKey','in':'cookie','name':'luna_access','description':'Luna HttpOnly JWT access cookie set by /api/auth/token/.'}
