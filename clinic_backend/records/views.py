from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prescription
from .serializers import PrescriptionSerializer
from support.models import Notification

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        prescription = serializer.save()
        
        # Notify Patient
        Notification.objects.create(
            user=prescription.patient.user,
            title='New Prescription',
            message=f'Dr. {prescription.doctor.user.full_name} has added a new prescription for you.'
        )
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from accounts.permissions import IsDoctor
            return [IsDoctor()]  # Only doctors can write/modify prescriptions
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'STAFF']:
            return Prescription.objects.all().select_related('patient__user', 'doctor__user', 'appointment')
        elif user.role == 'DOCTOR':
            # Doctor should see their own prescriptions, AND potentially others if querying for specific patient
            # For list view, maybe just their own.
            return Prescription.objects.all().select_related('patient__user', 'doctor__user', 'appointment')
        elif user.role == 'PATIENT':
            return Prescription.objects.filter(patient__user=user).select_related('patient__user', 'doctor__user', 'appointment')
        return Prescription.objects.none()
    
    @action(detail=False, methods=['get'])
    def patient_history(self, request):
        """Get history (prescriptions) for a specific patient"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({"error": "Patient ID is required"}, status=400)
        
        # Permission check
        if request.user.role == 'PATIENT':
            # Patient can only fetch their own history
            if not hasattr(request.user, 'patient_profile') or str(request.user.patient_profile.id) != str(patient_id):
                 return Response({"error": "You can only view your own history"}, status=403)
            
        paginator = self.pagination_class()
        prescriptions = Prescription.objects.filter(patient_id=patient_id).order_by('-created_at').select_related('patient__user', 'doctor__user', 'appointment')
        
        page = paginator.paginate_queryset(prescriptions, request)
        if page is not None:
             serializer = self.get_serializer(page, many=True)
             return paginator.get_paginated_response(serializer.data)
             
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_prescriptions(self, request):
        """Get current user's prescriptions"""
        if request.user.role == 'PATIENT':
            prescriptions = Prescription.objects.filter(patient__user=request.user).select_related('patient__user', 'doctor__user', 'appointment')
        elif request.user.role == 'DOCTOR':
            prescriptions = Prescription.objects.filter(doctor__user=request.user).select_related('patient__user', 'doctor__user', 'appointment')
        else:
            prescriptions = Prescription.objects.all().select_related('patient__user', 'doctor__user', 'appointment')
        
        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)