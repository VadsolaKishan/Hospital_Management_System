from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Department, Doctor, DoctorSlot
from .serializers import DepartmentSerializer, DoctorSerializer, DoctorSlotSerializer
from accounts.permissions import IsAdminOrStaff, IsDoctor

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'available_doctors', 'available_slots']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]
    
    def get_queryset(self):
        queryset = Doctor.objects.select_related('user', 'department')
        return queryset
    
    @action(detail=False, methods=['get'])
    def available_doctors(self, request):
        """Get list of available doctors"""
        doctors = Doctor.objects.filter(is_available=True).select_related('user', 'department')
        serializer = self.get_serializer(doctors, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def available_slots(self, request, pk=None):
        """Get available (active) slots for a specific doctor"""
        doctor = self.get_object()
        slots = doctor.slots.filter(is_active=True).order_by('weekday', 'start_time')
        serializer = DoctorSlotSerializer(slots, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def all_slots(self, request, pk=None):
        """Get all slots (active and inactive) for a specific doctor"""
        doctor = self.get_object()
        slots = doctor.slots.all().order_by('weekday', 'start_time')
        serializer = DoctorSlotSerializer(slots, many=True)
        return Response(serializer.data)


class DoctorSlotViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSlotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return DoctorSlot.objects.filter(doctor__user=user).order_by('weekday', 'start_time')
        return DoctorSlot.objects.all().order_by('weekday', 'start_time')