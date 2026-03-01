# accounts/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from threading import Thread
from .models import User, PasswordResetToken
from .serializers import (UserSerializer, UserRegistrationSerializer, LoginSerializer,
                         ForgotPasswordSerializer, VerifyResetTokenSerializer, ResetPasswordSerializer)
from .permissions import IsAdmin
from doctors.models import Doctor, Department
import string
import secrets
from django.db import transaction

def send_email_async(subject, message, from_email, recipient_list):
    """Send email asynchronously in background thread"""
    try:
        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )
    except Exception as e:
        print(f"Error sending email: {str(e)}")

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    
    def get_permissions(self):
        if self.action in ['register', 'login', 'forgot_password', 'verify_reset_token', 'reset_password']:
            return [AllowAny()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 'block_user', 'activate_user']:
            return [IsAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        User Registration
        """
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        User Login with JWT
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Try to get user by email and check password
            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    if not user.is_active:
                        return Response({
                            'error': 'Account is blocked. Contact admin.'
                        }, status=status.HTTP_403_FORBIDDEN)
                    
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'Login successful',
                        'user': UserSerializer(user).data,
                        'tokens': {
                            'refresh': str(refresh),
                            'access': str(refresh.access_token),
                        }
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Invalid credentials'
                    }, status=status.HTTP_401_UNAUTHORIZED)
            except User.DoesNotExist:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def create_doctor(self, request):
        """
        Create a Doctor account (Admin only)
        """
        data = request.data
        email = data.get('email')
        password = data.get('password')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not password:
            return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters long'}, 
                           status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # 1. Create User with provided password
                user = User(
                    email=email,
                    first_name=data.get('first_name'),
                    last_name=data.get('last_name'),
                    phone=data.get('phone', ''),
                    role='DOCTOR',
                    is_active=True
                )
                user.set_password(password)
                user.save()
                
                # 2. Create Doctor Profile
                department_id = data.get('department')
                department = None
                if department_id:
                    try:
                        department = Department.objects.get(id=department_id)
                    except Department.DoesNotExist:
                        pass
                
                Doctor.objects.create(
                    user=user,
                    department=department,
                    specialization=data.get('specialization', ''),
                    qualification=data.get('qualification', ''),
                    experience_years=data.get('experience_years', 0),
                    consultation_fee=data.get('consultation_fee', 0),
                    license_number=data.get('license_number', ''),
                    bio=data.get('bio', ''),
                    created_by=request.user
                )

                return Response({
                    'message': 'Doctor account created successfully',
                    'email': email
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get', 'patch'])
    def profile(self, request):
        """
        Get or update current user profile
        """
        if request.method == 'PATCH':
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def block_user(self, request, pk=None):
        """
        Block/Deactivate a user (Admin only)
        """
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({
            'message': f'User {user.email} has been blocked'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def activate_user(self, request, pk=None):
        """
        Activate a user (Admin only)
        """
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({
            'message': f'User {user.email} has been activated'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def pending_doctors(self, request):
        """
        Get list of users with role='DOCTOR' who don't have a Doctor profile yet
        """
        # Import inside method to avoid circular import if needed, though models is imported
        from doctors.models import Doctor
        
        # Get IDs of users who already have a Doctor profile
        existing_doctor_user_ids = Doctor.objects.values_list('user_id', flat=True)
        
        # Filter users with role DOCTOR who are NOT in the existing list
        pending_users = User.objects.filter(role='DOCTOR').exclude(id__in=existing_doctor_user_ids)
        
        serializer = UserSerializer(pending_users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """
        Request password reset - generates token and sends email
        """
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Delete existing token if any
            PasswordResetToken.objects.filter(user=user).delete()
            
            # Generate new token
            token = PasswordResetToken.generate_token()
            expiration_time = timezone.now() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRATION_HOURS)
            
            reset_token = PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=expiration_time
            )
            
            # Create reset link
            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            # Prepare email
            subject = 'Password Reset Request'
            message = f'''
Hello {user.first_name},

You have requested to reset your password. Please click the link below to proceed:

{reset_link}

This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRATION_HOURS} hours.

If you did not request this, please ignore this email.

Best regards,
Hospital Management System
            '''
            
            # Send email asynchronously in background thread
            email_thread = Thread(
                target=send_email_async,
                args=(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
            )
            email_thread.daemon = True
            email_thread.start()
            
            # Return success immediately without waiting for email to complete
            return Response({
                'message': 'Password reset link has been sent to your email'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_reset_token(self, request):
        """
        Verify if reset token is valid
        """
        serializer = VerifyResetTokenSerializer(data=request.data)
        if serializer.is_valid():
            return Response({
                'message': 'Token is valid',
                'valid': True
            }, status=status.HTTP_200_OK)
        
        return Response({
            'valid': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        """
        Reset password using valid token
        """
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            password = serializer.validated_data['password']
            
            reset_token = PasswordResetToken.objects.get(token=token)
            user = reset_token.user
            
            # Set new password
            user.set_password(password)
            user.save()
            
            # Mark token as used
            reset_token.is_used = True
            reset_token.save()
            
            return Response({
                'message': 'Password has been reset successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)