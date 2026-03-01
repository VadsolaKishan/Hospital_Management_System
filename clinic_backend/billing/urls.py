from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillingViewSet

router = DefaultRouter()
router.register(r'', BillingViewSet, basename='billing')

urlpatterns = [
    path('', include(router.urls)),
]
