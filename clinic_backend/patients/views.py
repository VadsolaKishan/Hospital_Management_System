from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Patient
from .serializers import PatientSerializer
from accounts.permissions import (
    IsAdminOrStaff,
    IsPatientOwner,
    IsDoctorOfPatient,
)


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        - list / retrieve: any authenticated user (queryset handles filtering)
        - create / destroy: Admin or Staff only
        - update / partial_update: Admin/Staff can edit any; Patients handled
          via my_profile action. Object-level check added below.
        """
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated(), IsDoctorOfPatient()]
        elif self.action in ["create", "destroy"]:
            return [IsAdminOrStaff()]
        elif self.action in ["update", "partial_update"]:
            # Admin/Staff may edit any patient; patients edit via my_profile.
            # Object-level IsPatientOwner lets a patient edit only their own.
            return [IsAuthenticated(), IsPatientOwner()]
        return [IsAuthenticated()]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["user__first_name", "user__last_name", "uhid"]
    ordering_fields = ["created_at", "user__first_name"]

    ordering = ["-created_at"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Error:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )
        except Exception as e:
            print("Exception in Patient create:", str(e))
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_destroy(self, instance):
        user = instance.user
        if user:
            user.delete()
        else:
            instance.delete()

    def get_queryset(self):
        """
        Queryset filtering — the first line of defence.

        ADMIN / STAFF  → all patients
        PATIENT        → only their own profile
        DOCTOR         → only patients with whom they share an APPROVED or
                         VISITED appointment (prevents URL-guessing attacks)
        """
        user = self.request.user
        queryset = Patient.objects.all().select_related("user")

        if user.role in ["ADMIN", "STAFF"]:
            return queryset.filter(user__role="PATIENT")

        elif user.role == "PATIENT":
            return queryset.filter(user=user)

        elif user.role == "DOCTOR":
            if hasattr(user, "doctor_profile"):
                doctor_id = user.doctor_profile.id
                # Only patients with APPROVED or VISITED appointments
                return queryset.filter(
                    appointments__doctor_id=doctor_id,
                    appointments__status__in=["APPROVED", "VISITED"],
                ).distinct()
            return Patient.objects.none()

        return Patient.objects.none()

    @action(detail=False, methods=["get", "put", "patch"])
    def my_profile(self, request):
        """Get or update patient's own profile - auto-creates one if missing"""
        from django.utils import timezone

        patient, created = Patient.objects.get_or_create(
            user=request.user,
            defaults={
                "date_of_birth": timezone.now().date(),
                "gender": "M",
            },
        )

        if request.method in ["PUT", "PATCH"]:
            partial = request.method == "PATCH"
            serializer = self.get_serializer(
                patient, data=request.data, partial=partial
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = self.get_serializer(patient)
        return Response(serializer.data)
