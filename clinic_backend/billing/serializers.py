from rest_framework import serializers
from .models import Billing

class BillingSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    doctor_name = serializers.CharField(source='appointment.doctor.user.full_name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)
    appointment_time = serializers.TimeField(source='appointment.appointment_time', read_only=True)
    case_type = serializers.CharField(source='appointment.case_type', read_only=True)
    appointment_details = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    status = serializers.CharField(source='payment_status', read_only=False)
    
    class Meta:
        model = Billing
        fields = [
            'id', 'appointment', 'patient', 'patient_name', 'patient_uhid', 'doctor_name',
            'appointment_date', 'appointment_time', 'case_type',
            'doctor_fee', 'hospital_charge', 'bed_charge', 
            'bed_days', 'bed_charge_per_day',
            'discount_percentage', 'discount_amount', 'final_amount',
            'total_amount', 'paid_amount',
            'balance', 'status', 'payment_status', 'payment_method', 'invoice_number',
            'notes', 'created_at', 'updated_at', 'appointment_details'
        ]
        read_only_fields = ['created_at', 'updated_at', 'invoice_number']
    
    def get_appointment_details(self, obj):
        return {
            'date': str(obj.appointment.appointment_date),
            'time': str(obj.appointment.appointment_time),
            'doctor': obj.appointment.doctor.user.full_name
        }
    
    def get_balance(self, obj):
        return float(obj.final_amount - obj.paid_amount)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure payment_status is returned for compatibility
        data['status'] = data.get('payment_status', data.get('status'))
        return data