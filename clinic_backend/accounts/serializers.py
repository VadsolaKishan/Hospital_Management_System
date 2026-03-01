# accounts/serializers.py

from rest_framework import serializers
from .models import User, PasswordResetToken

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    patient_id = serializers.SerializerMethodField()
    doctor_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 
                  'phone', 'role', 'is_active', 'full_name', 'created_at', 'patient_id', 'doctor_id']
        read_only_fields = ['id', 'created_at']
    
    def get_patient_id(self, obj):
        if hasattr(obj, 'patient_profile'):
            return obj.patient_profile.id
        return None

    def get_doctor_id(self, obj):
        if hasattr(obj, 'doctor_profile'):
            return obj.doctor_profile.id
        return None
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'first_name', 
                  'last_name', 'phone']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        validated_data['role'] = 'PATIENT'
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    # Don't validate if user exists - handle it in view for security
    # (prevents email enumeration attacks)


class VerifyResetTokenSerializer(serializers.Serializer):
    token = serializers.CharField()
    
    def validate_token(self, value):
        try:
            reset_token = PasswordResetToken.objects.get(token=value)
            if not reset_token.is_valid():
                raise serializers.ValidationError("Token is invalid or expired")
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        
        token = attrs.get('token')
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if not reset_token.is_valid():
                raise serializers.ValidationError("Token is invalid or expired")
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid token")
        
        return attrs