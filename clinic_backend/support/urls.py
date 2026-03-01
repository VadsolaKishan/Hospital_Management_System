from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, QueryViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'queries', QueryViewSet, basename='query')

urlpatterns = [
    path('', include(router.urls)),
]