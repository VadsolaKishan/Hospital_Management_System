from rest_framework import serializers
from .models import Department, Doctor, DoctorSlot
from accounts.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class DoctorSerializer(serializers.ModelSerializer):
    user = serializers.IntegerField(write_only=True, required=True)
    user_details = UserSerializer(source='user', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'user_details', 'department', 'department_name', 'user_name', 'user_email', 
                  'specialization', 'qualification', 'experience_years', 'consultation_fee', 
                  'license_number', 'bio', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['user_details', 'user_name', 'user_email', 'department_name', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        user_id = validated_data.pop('user', None)
        if user_id:
            from accounts.models import User
            try:
                user = User.objects.get(id=user_id)
                validated_data['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User not found'})
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        user_id = validated_data.pop('user', None)
        if user_id:
            from accounts.models import User
            try:
                user = User.objects.get(id=user_id)
                validated_data['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError({'user': 'User not found'})
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        """Override to_representation to include user object for read operations"""
        ret = super().to_representation(instance)
        if instance and hasattr(instance, 'user'):
            ret['user'] = instance.user.id
        return ret


class DoctorSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.user.full_name', read_only=True)
    
    class Meta:
        model = DoctorSlot
        fields = '__all__'
        read_only_fields = ['created_at']