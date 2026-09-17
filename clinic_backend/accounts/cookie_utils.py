from django.conf import settings
from django.utils import timezone
from datetime import timedelta

def set_auth_cookie(response, refresh_token):
    max_age = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7)).total_seconds()
    is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', False)
    samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
    
    response.set_cookie(
        key='refresh_token',
        value=str(refresh_token),
        max_age=int(max_age),
        secure=is_secure,
        httponly=True,
        samesite=samesite
    )
    return response

def delete_auth_cookie(response):
    samesite = getattr(settings, 'SESSION_COOKIE_SAMESITE', 'Lax')
    
    response.delete_cookie(
        key='refresh_token',
        samesite=samesite
    )
    return response
