from rest_framework import serializers
from .models import Appointment


class SimplePatientSerializer(serializers.Serializer):
    """Simplified patient serializer for nested use in appointments"""

    id = serializers.IntegerField()
    user_name = serializers.CharField(source="user.full_name")
    user_email = serializers.CharField(source="user.email")
    uhid = serializers.CharField()


class SimpleDoctorSerializer(serializers.Serializer):
    """Simplified doctor serializer for nested use in appointments"""

    id = serializers.IntegerField()
    user_name = serializers.CharField(source="user.full_name")
    user_email = serializers.CharField(source="user.email")
    specialization = serializers.CharField()
    department_name = serializers.CharField(source="department.name")


class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = SimplePatientSerializer(source="patient", read_only=True)
    doctor_details = SimpleDoctorSerializer(source="doctor", read_only=True)
    patient_name = serializers.CharField(
        source="patient.user.full_name", read_only=True
    )
    patient_uhid = serializers.CharField(source="patient.uhid", read_only=True)
    doctor_name = serializers.CharField(source="doctor.user.full_name", read_only=True)
    has_billing = serializers.SerializerMethodField()
    billing_status = serializers.SerializerMethodField()
    has_prescription = serializers.SerializerMethodField()
    prescription_id = serializers.SerializerMethodField()
    prescription_info = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "doctor",
            "appointment_date",
            "appointment_time",
            "reason",
            "status",
            "notes",
            "patient_details",
            "doctor_details",
            "patient_name",
            "patient_uhid",
            "doctor_name",
            "has_billing",
            "billing_status",
            "has_prescription",
            "prescription_id",
            "prescription_info",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "patient_details",
            "doctor_details",
            "patient_name",
            "patient_uhid",
            "doctor_name",
            "has_billing",
            "billing_status",
            "has_prescription",
            "prescription_id",
            "prescription_info",
            "created_at",
            "updated_at",
        ]

    def get_has_billing(self, obj):
        """Check if appointment has associated billing"""
        try:
            return hasattr(obj, "billing") and obj.billing is not None
        except:
            return False

    def get_billing_status(self, obj):
        """Get billing status if exists"""
        try:
            if hasattr(obj, "billing") and obj.billing:
                return obj.billing.payment_status
        except:
            pass
        return None

    def get_has_prescription(self, obj):
        """Check if appointment has associated prescription"""
        try:
            return obj.prescriptions.exists()
        except:
            return False

    def get_prescription_id(self, obj):
        """Get ID of the first associated prescription if exists"""
        try:
            first = obj.prescriptions.first()
            return first.id if first else None
        except:
            return None

    def get_prescription_info(self, obj):
        """Get basic info of the prescription"""
        try:
            first = obj.prescriptions.first()
            if first:
                return {
                    "diagnosis": first.diagnosis,
                    "medications": first.medications,
                    "instructions": first.instructions,
                }
            return None
        except:
            return None

    def validate(self, data):
        doctor = data.get("doctor", self.instance.doctor if self.instance else None)
        date = data.get("appointment_date", self.instance.appointment_date if self.instance else None)
        time = data.get("appointment_time", self.instance.appointment_time if self.instance else None)
        status = data.get("status", self.instance.status if self.instance else "PENDING")

        if status in ["PENDING", "APPROVED"] and doctor and date and time:
            qs = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=date,
                appointment_time=time,
                status__in=["PENDING", "APPROVED"]
            )
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError(
                    {"non_field_errors": ["This time slot is already booked for the selected doctor."]}
                )
        return data
