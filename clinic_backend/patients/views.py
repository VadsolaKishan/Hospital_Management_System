from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer
from accounts.permissions import IsAdminOrStaff, IsPatient

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]
    
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__phone', 'uhid']
    ordering_fields = ['created_at', 'user__first_name']
    ordering = ['-created_at']
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Error:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            print("Exception in Patient create:", str(e))
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_queryset(self):
        user = self.request.user
        queryset = Patient.objects.all().select_related('user')
        
        if user.role in ['ADMIN', 'STAFF']:
            return queryset.filter(user__role='PATIENT')
            
        elif user.role == 'PATIENT':
            return queryset.filter(user=user)
            
        elif user.role == 'DOCTOR':
            if hasattr(user, 'doctor_profile'):
                doctor_id = user.doctor_profile.id
                # Filter patients who have appointments with this doctor
                return queryset.filter(
                    appointments__doctor_id=doctor_id
                ).distinct()
            return Patient.objects.none()
            
        return Patient.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to add access control for doctors"""
        instance = self.get_object()
        
        # Additional check for doctors
        if request.user.role == 'DOCTOR':
            # Verify this patient is in the doctor's queryset
            if not self.get_queryset().filter(id=instance.id).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this patient's records.")
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def my_profile(self, request):
        """Get or update patient's own profile - auto-creates one if missing"""
        from django.utils import timezone

        patient, created = Patient.objects.get_or_create(
            user=request.user,
            defaults={
                'date_of_birth': timezone.now().date(),
                'gender': 'M',
            }
        )
        
        if request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = self.get_serializer(patient, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = self.get_serializer(patient)
        return Response(serializer.data)