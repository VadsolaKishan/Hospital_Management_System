from rest_framework import serializers
from .models import Ward, Bed, BedAllocation, BedRequest
from patients.serializers import PatientSerializer
from doctors.serializers import DoctorSerializer

class WardSerializer(serializers.ModelSerializer):
    total_beds = serializers.IntegerField(read_only=True)
    available_beds = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ward
        fields = ['id', 'name', 'ward_type', 'floor_number', 'description', 'total_beds', 'available_beds']

class BedAllocationSerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    patient_uhid = serializers.CharField(source='patient.uhid', read_only=True)
    bed_details = serializers.StringRelatedField(source='bed', read_only=True)
    
    class Meta:
        model = BedAllocation
        fields = ['id', 'bed', 'bed_details', 'patient', 'patient_details', 'patient_name', 'patient_uhid', 
                 'admission_date', 'discharge_date', 'reason', 'status', 'payment_status', 'notes']
        read_only_fields = ['admission_date', 'discharge_date'] # discharge_date set by action

class BedSerializer(serializers.ModelSerializer):
    ward_name = serializers.CharField(source='ward.name', read_only=True)
    current_allocation = serializers.SerializerMethodField()
    
    class Meta:
        model = Bed
        fields = ['id', 'ward', 'ward_name', 'bed_number', 'bed_type', 'price_per_day', 'status', 'is_active', 'current_allocation']
        
    def get_current_allocation(self, obj):
        # Fetch the active allocation if it exists
        allocation = obj.allocations.filter(status='ACTIVE').first()
        if allocation:
            return BedAllocationSerializer(allocation).data
        return None

class BedRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    
    class Meta:
        model = BedRequest
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'appointment', 
                 'expected_bed_days', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
