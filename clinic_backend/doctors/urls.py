from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, DoctorViewSet, DoctorSlotViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'slots', DoctorSlotViewSet, basename='slot')

urlpatterns = [
    path('', include(router.urls)),
]