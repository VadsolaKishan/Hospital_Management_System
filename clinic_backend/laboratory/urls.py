from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LabTestTypeViewSet, LabRequestViewSet

router = DefaultRouter()
router.register(r"test-types", LabTestTypeViewSet, basename="lab-test-type")
router.register(r"requests", LabRequestViewSet, basename="lab-request")

urlpatterns = [
    path("", include(router.urls)),
]
