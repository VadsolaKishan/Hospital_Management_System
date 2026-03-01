from rest_framework import serializers
from .models import Prescription
from appointments.models import Appointment
from beds.models import BedRequest

class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    appointment_reason = serializers.CharField(source='appointment.reason', read_only=True)
    billing_status = serializers.SerializerMethodField()
    billing_invoice = serializers.SerializerMethodField()
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)
    patient_age = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'appointment', 'patient', 'doctor', 'patient_name', 'patient_uhid', 'doctor_name',
            'patient_gender', 'patient_age',
            'appointment_reason', 'diagnosis', 'medications', 'instructions',
            'follow_up_date', 'billing_status', 'billing_invoice', 'created_at', 'updated_at',
            'bed_required', 'expected_bed_days'
        ]
        read_only_fields = ['created_at', 'updated_at', 'patient', 'doctor', 'patient_name', 'patient_uhid', 'doctor_name', 'appointment_reason', 'billing_status', 'billing_invoice']
    
    def get_billing_status(self, obj):
        """Get associated billing payment status"""
        billing = obj.billing
        return billing.payment_status if billing else None
    
    def get_patient_age(self, obj):
        from datetime import date
        if obj.patient.date_of_birth:
            today = date.today()
            dob = obj.patient.date_of_birth
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None

    def get_billing_invoice(self, obj):
        """Get associated billing invoice number"""
        billing = obj.billing
        return billing.invoice_number if billing else None
    
    def validate(self, data):
        # Check for existing prescription on create only
        if not self.instance:
            appointment = data.get('appointment')
            if appointment and appointment.prescriptions.exists():
                 raise serializers.ValidationError({"appointment": "A prescription already exists for this appointment."})

        if data.get('bed_required'):
            if not data.get('expected_bed_days') or data.get('expected_bed_days') <= 0:
                raise serializers.ValidationError({
                    "expected_bed_days": "Expected bed days must be greater than 0 when bed is required."
                })
        return data

    def create(self, validated_data):
        """Auto-populate patient and doctor from appointment"""
        appointment = validated_data.get('appointment')
        if appointment:
            validated_data['patient'] = appointment.patient
            validated_data['doctor'] = appointment.doctor
            
            # Update appointment status to VISITED after prescription creation
            appointment.status = 'VISITED'
            appointment.save()
        
        prescription = super().create(validated_data)

        # Create Bed Request if required
        if prescription.bed_required:
            BedRequest.objects.create(
                patient=prescription.patient,
                doctor=prescription.doctor,
                appointment=prescription.appointment,
                expected_bed_days=prescription.expected_bed_days,
                status='PENDING'
            )
            
        return prescription