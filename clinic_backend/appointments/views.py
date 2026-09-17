from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Appointment
from .serializers import AppointmentSerializer
from accounts.permissions import IsAdminOrStaff, IsAppointmentParticipant
from support.models import Notification
from accounts.models import User


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, IsAppointmentParticipant]

    def get_permissions(self):
        """
        - list / upcoming: IsAuthenticated (queryset handles role filtering)
        - retrieve: IsAuthenticated + IsAppointmentParticipant (object-level)
        - create: IsAuthenticated (role logic in perform_create)
        - approve / reject: Admin only (checked inside the action)
        - cancel: checked inside the action (patient own + admin)
        - update / partial_update / destroy: Admin or Staff only
        """
        if self.action in ["list", "upcoming", "create"]:
            return [IsAuthenticated()]
        if self.action in ["retrieve", "cancel"]:
            return [IsAuthenticated(), IsAppointmentParticipant()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """
        Queryset filtering — prevents URL manipulation.

        PATIENT → only their own appointments
        DOCTOR  → only their own appointments (APPROVED / VISITED)
        ADMIN / STAFF → all appointments
        """
        user = self.request.user
        queryset = Appointment.objects.none()

        if user.role == "PATIENT":
            queryset = Appointment.objects.filter(patient__user=user)
        elif user.role == "DOCTOR":
            # Doctor sees ONLY Approved or Visited appointments
            queryset = Appointment.objects.filter(
                doctor__user=user, status__in=["APPROVED", "VISITED"]
            )
        elif user.role in ["ADMIN", "STAFF"]:
            queryset = Appointment.objects.all()

        # Optimize query
        queryset = queryset.select_related("patient__user", "doctor__user")

        # Filter by patient_id if provided (for history)
        patient_id = self.request.query_params.get("patient_id")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return queryset

    def perform_create(self, serializer):
        """
        When creating a new appointment:
        - If user is PATIENT, automatically assign them as the patient
        - If user is ADMIN/STAFF, they can specify the patient
        - DOCTOR role is rejected (doctors receive appointments, not create)
        """
        from django.db import transaction, IntegrityError

        user = self.request.user

        if user.role == "DOCTOR":
            raise serializers.ValidationError(
                {"error": "Doctors cannot create appointments."}
            )

        try:
            with transaction.atomic():
                if user.role == "PATIENT":
                    # Ensure the patient exists for this user
                    try:
                        from patients.models import Patient

                        patient = Patient.objects.get(user=user)
                        appointment = serializer.save(patient=patient)

                        # Notify Admins of new appointment
                        admins = User.objects.filter(role="ADMIN")
                        for admin in admins:
                            Notification.objects.create(
                                user=admin,
                                title="New Appointment Request",
                                message=f"New appointment request from {user.full_name} for Dr. {appointment.doctor.user.full_name}",
                            )
                    except Patient.DoesNotExist:
                        raise serializers.ValidationError(
                            {"error": "Patient profile not found."}
                        )
                else:
                    appointment = serializer.save()
        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": ["This time slot is already booked. Please choose another."]}
            )

    def perform_update(self, serializer):
        from django.db import transaction, IntegrityError

        try:
            with transaction.atomic():
                instance = Appointment.objects.select_for_update().get(id=self.get_object().id)
                old_status = instance.status
                appointment = serializer.save()

                # Check for status changes
                if old_status != appointment.status:
                    if appointment.status == "APPROVED":
                        # Notify Patient
                        Notification.objects.create(
                            user=appointment.patient.user,
                            title="Appointment Approved",
                            message=f"Your appointment with Dr. {appointment.doctor.user.full_name} has been approved",
                        )
                        # Notify Doctor
                        Notification.objects.create(
                            user=appointment.doctor.user,
                            title="New Appointment",
                            message=f"You have a new appointment with {appointment.patient.user.full_name} on {appointment.appointment_date}",
                        )
                    elif appointment.status == "REJECTED":
                        Notification.objects.create(
                            user=appointment.patient.user,
                            title="Appointment Rejected",
                            message=f"Your appointment with Dr. {appointment.doctor.user.full_name} has been rejected",
                        )
                    elif appointment.status == "VISITED":
                        Notification.objects.create(
                            user=appointment.patient.user,
                            title="Consultation Completed",
                            message=f"Your visit with Dr. {appointment.doctor.user.full_name} has been marked as completed",
                        )
        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": ["This time slot is already booked. Please choose another."]}
            )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Approve an appointment - only ADMIN can approve"""
        from django.db import transaction

        user = request.user

        # Only ADMIN can approve appointments
        if user.role != "ADMIN":
            return Response(
                {"error": "Only administrators can approve appointments"},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            appointment = Appointment.objects.select_for_update().get(pk=pk)

            if appointment.status != "PENDING":
                return Response(
                    {"error": f"Cannot approve appointment in {appointment.status} state."},
                    status=status.HTTP_409_CONFLICT,
                )

            appointment.status = "APPROVED"
            appointment.save()

            # Notify patient of approval
            Notification.objects.create(
                user=appointment.patient.user,
                title="Appointment Approved",
                message=f"Your appointment with Dr. {appointment.doctor.user.full_name} has been approved",
            )

            # Notify Doctor
            Notification.objects.create(
                user=appointment.doctor.user,
                title="New Appointment Scheduled",
                message=f"You have a new appointment with {appointment.patient.user.full_name} on {appointment.appointment_date} at {appointment.appointment_time}",
            )

        return Response(
            {"status": "APPROVED", "message": "Appointment approved successfully"}
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment.
        - Patients can cancel only their own *active* appointments
          (PENDING or APPROVED).
        - Admins can cancel any appointment.
        """
        from django.db import transaction

        user = request.user

        with transaction.atomic():
            appointment = Appointment.objects.select_for_update().get(pk=pk)

            can_cancel = False
            if user.role == "PATIENT" and appointment.patient.user == user:
                # Only allow cancelling active appointments
                if appointment.status in ("PENDING", "APPROVED"):
                    can_cancel = True
            elif user.role == "ADMIN":
                can_cancel = True

            if not can_cancel:
                return Response(
                    {"error": "You do not have permission to cancel this appointment"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if appointment.status in ["CANCELLED", "REJECTED", "VISITED"]:
                return Response(
                    {"error": f"Cannot cancel appointment in {appointment.status} state."},
                    status=status.HTTP_409_CONFLICT,
                )

            appointment.status = "CANCELLED"
            appointment.save()

            # Notify patient of cancellation (if not cancelled by patient)
            if appointment.patient.user != user:
                Notification.objects.create(
                    user=appointment.patient.user,
                    title="Appointment Cancelled",
                    message=f"Your appointment with Dr. {appointment.doctor.user.full_name} has been cancelled",
                )

        return Response(
            {"status": "CANCELLED", "message": "Appointment cancelled successfully"}
        )

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """Reject/Decline an appointment - only ADMIN can reject"""
        from django.db import transaction

        user = request.user

        # Only ADMIN can reject appointments
        if user.role != "ADMIN":
            return Response(
                {"error": "Only administrators can reject appointments"},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            appointment = Appointment.objects.select_for_update().get(pk=pk)

            if appointment.status not in ["PENDING", "APPROVED"]:
                return Response(
                    {"error": f"Cannot reject appointment in {appointment.status} state."},
                    status=status.HTTP_409_CONFLICT,
                )

            reason = request.data.get("reason", "No reason provided")
            appointment.status = "REJECTED"
            appointment.save()

            # Notify patient of rejection
            Notification.objects.create(
                user=appointment.patient.user,
                title="Appointment Rejected",
                message=f"Your appointment with Dr. {appointment.doctor.user.full_name} has been rejected. Reason: {reason}",
            )

        return Response({"status": "REJECTED", "message": "Appointment rejected"})

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        """Get upcoming appointments"""
        today = timezone.now().date()
        appointments = (
            self.get_queryset()
            .filter(appointment_date__gte=today, status__in=["PENDING", "APPROVED"])
            .select_related("patient__user", "doctor__user")
        )
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)
