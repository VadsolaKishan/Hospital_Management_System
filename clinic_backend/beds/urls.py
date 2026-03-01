from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WardViewSet, BedViewSet, BedAllocationViewSet, BedRequestViewSet

router = DefaultRouter()
router.register(r'wards', WardViewSet)
router.register(r'beds', BedViewSet)
router.register(r'allocations', BedAllocationViewSet)
router.register(r'requests', BedRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
