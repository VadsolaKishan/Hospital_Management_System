from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prescription
from .serializers import PrescriptionSerializer
from support.models import Notification
from accounts.permissions import (
    IsDoctor,
    IsPrescriptionOwnerDoctor,
)


class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        prescription = serializer.save()

        # Notify Patient
        Notification.objects.create(
            user=prescription.patient.user,
            title="New Prescription",
            message=f"Dr. {prescription.doctor.user.full_name} has added a new prescription for you.",
        )

    def get_permissions(self):
        """
        - create: only Doctors
        - update / partial_update / destroy: only the doctor who owns the
          prescription (IsPrescriptionOwnerDoctor includes Admin/Staff bypass)
        - list / retrieve / my_prescriptions / patient_history: any
          authenticated user (queryset handles role filtering)
        """
        if self.action == "create":
            return [IsDoctor()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsDoctor(), IsPrescriptionOwnerDoctor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Queryset filtering — prevents URL manipulation.

        ADMIN / STAFF  → all prescriptions
        DOCTOR         → only prescriptions they authored
        PATIENT        → only their own prescriptions
        """
        user = self.request.user
        base = Prescription.objects.all().select_related(
            "patient__user", "doctor__user", "appointment"
        )

        if user.role in ["ADMIN", "STAFF"]:
            return base
        elif user.role == "DOCTOR":
            # Doctor can only see prescriptions they themselves created
            return base.filter(doctor__user=user)
        elif user.role == "PATIENT":
            return base.filter(patient__user=user)
        return Prescription.objects.none()

    @action(detail=False, methods=["get"])
    def patient_history(self, request):
        """Get history (prescriptions) for a specific patient"""
        patient_id = request.query_params.get("patient_id")
        if not patient_id:
            return Response({"error": "Patient ID is required"}, status=400)

        # Permission check
        if request.user.role == "PATIENT":
            # Patient can only fetch their own history
            if not hasattr(request.user, "patient_profile") or str(
                request.user.patient_profile.id
            ) != str(patient_id):
                return Response(
                    {"error": "You can only view your own history"}, status=403
                )

        elif request.user.role == "DOCTOR":
            # Doctor can only view history of patients they have treated
            from appointments.models import Appointment

            if not hasattr(request.user, "doctor_profile"):
                return Response(
                    {"error": "Doctor profile not found"}, status=403
                )
            has_relationship = Appointment.objects.filter(
                doctor=request.user.doctor_profile,
                patient_id=patient_id,
                status__in=["APPROVED", "VISITED"],
            ).exists()
            if not has_relationship:
                return Response(
                    {"error": "You do not have access to this patient's history"},
                    status=403,
                )

        paginator = self.pagination_class()
        prescriptions = (
            Prescription.objects.filter(patient_id=patient_id)
            .order_by("-created_at")
            .select_related("patient__user", "doctor__user", "appointment")
        )

        page = paginator.paginate_queryset(prescriptions, request)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def my_prescriptions(self, request):
        """Get current user's prescriptions"""
        if request.user.role == "PATIENT":
            prescriptions = Prescription.objects.filter(
                patient__user=request.user
            ).select_related("patient__user", "doctor__user", "appointment")
        elif request.user.role == "DOCTOR":
            prescriptions = Prescription.objects.filter(
                doctor__user=request.user
            ).select_related("patient__user", "doctor__user", "appointment")
        else:
            prescriptions = Prescription.objects.all().select_related(
                "patient__user", "doctor__user", "appointment"
            )

        serializer = self.get_serializer(prescriptions, many=True)
        return Response(serializer.data)
