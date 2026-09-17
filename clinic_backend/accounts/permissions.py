# accounts/permissions.py

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Permission check for ADMIN role
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsDoctor(BasePermission):
    """
    Permission check for DOCTOR role
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "DOCTOR"
        )


class IsStaff(BasePermission):
    """
    Permission check for STAFF role
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STAFF"
        )


class IsPatient(BasePermission):
    """
    Permission check for PATIENT role
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "PATIENT"
        )


class IsAdminOrStaff(BasePermission):
    """
    Permission check for ADMIN or STAFF roles
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "STAFF"]
        )


class IsAdminOrDoctor(BasePermission):
    """
    Permission check for ADMIN or DOCTOR roles
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "DOCTOR"]
        )


class IsLabTechnician(BasePermission):
    """
    Permission check for LAB_TECHNICIAN role
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "LAB_TECHNICIAN"
        )


# ---------------------------------------------------------------------------
# Object-level permission classes
# ---------------------------------------------------------------------------


class IsPatientOwner(BasePermission):
    """
    Object-level permission: ensures a Patient can only access their own
    Patient profile object.  Admins and Staff bypass this check.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("ADMIN", "STAFF"):
            return True
        # obj is a Patient instance
        return obj.user == request.user


class IsAppointmentParticipant(BasePermission):
    """
    Object-level permission: ensures the requesting user is either the
    patient or the doctor on this appointment.  Admins and Staff bypass.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("ADMIN", "STAFF"):
            return True
        if request.user.role == "PATIENT":
            return obj.patient.user == request.user
        if request.user.role == "DOCTOR":
            return obj.doctor.user == request.user
        return False


class IsPrescriptionOwnerDoctor(BasePermission):
    """
    Object-level permission: only the doctor who created the prescription
    (or Admin/Staff) may modify it.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("ADMIN", "STAFF"):
            return True
        if request.user.role == "DOCTOR":
            return obj.doctor.user == request.user
        return False


class IsDoctorOfPatient(BasePermission):
    """
    Object-level permission: a Doctor can only access a Patient object if
    they share at least one APPROVED or VISITED appointment.
    Admins and Staff bypass this check.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ("ADMIN", "STAFF"):
            return True
        if request.user.role == "PATIENT":
            return obj.user == request.user
        if request.user.role == "DOCTOR":
            if not hasattr(request.user, "doctor_profile"):
                return False
            from appointments.models import Appointment

            return Appointment.objects.filter(
                doctor=request.user.doctor_profile,
                patient=obj,
                status__in=["APPROVED", "VISITED"],
            ).exists()
        return False
