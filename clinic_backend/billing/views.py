from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch, Q
from .models import Billing
from .serializers import BillingSerializer
from appointments.models import Appointment
from accounts.permissions import IsAdminOrStaff
from support.models import Notification
from accounts.models import User
import random
import string
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

class BillingViewSet(viewsets.ModelViewSet):
    serializer_class = BillingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        base_qs = Billing.objects.select_related(
            'appointment',
            'appointment__patient__user',
            'appointment__doctor__user',
            'patient__user'
        ).prefetch_related('appointment__prescriptions')
        
        if user.role in ['ADMIN', 'STAFF']:
            return base_qs
        elif user.role == 'PATIENT':
            return base_qs.filter(patient__user=user)
        return Billing.objects.none()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]
    
    def perform_create(self, serializer):
        # Generate unique invoice number
        invoice_number = f"INV-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
        appointment = serializer.validated_data.get('appointment')
        # Auto-populate patient from appointment
        serializer.save(invoice_number=invoice_number, patient=appointment.patient)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrStaff])
    def calculate_fees(self, request):
        """Calculate fees for an appointment before creating invoice"""
        appointment_id = request.query_params.get('appointment_id')
        if not appointment_id:
            return Response({'error': 'appointment_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Calculate fees logic
        doctor_fee = appointment.doctor.consultation_fee
        hospital_charge = float(doctor_fee) * 0.10
        
        # Calculate bed charges
        bed_charge = 0
        bed_days = 0
        bed_charge_per_day = 0

        try:
            # Calculate total days in hospital if any allocations exist
            # We look for the most relevant allocation (active or recently discharged)
            # STRICT CHECK: Only consider allocations that haven't been paid for AND are valid
            allocations = appointment.patient.bed_allocations.filter(
                payment_status='PENDING',
                status__in=['ACTIVE', 'DISCHARGED'] # Must be explicitly Active or Discharged
            ).order_by('-admission_date')
            
            if allocations.exists():
                allocation = allocations.first()
                # Ensure bed exists (though it should due to foreign key constraints, checking safely)
                # AND ensure bed is actually assigned (allocation.bed is not None)
                if hasattr(allocation, 'bed') and allocation.bed:
                    start_date = allocation.admission_date
                    end_date = allocation.discharge_date if allocation.discharge_date else timezone.now()
                    
                    # Ensure timezone compatibility
                    if timezone.is_naive(start_date):
                        start_date = timezone.make_aware(start_date)
                    if timezone.is_naive(end_date):
                        end_date = timezone.make_aware(end_date)
                    
                    # Calculate duration
                    duration = end_date - start_date
                    days = duration.days
                    
                    # Minimum 1 day charge
                    if days < 1:
                        days = 1
                    
                    bed_days = days
                    bed_charge_per_day = float(allocation.bed.price_per_day)
                    bed_charge = bed_days * bed_charge_per_day
                    
        except Exception as e:
            print(f"Error calculating bed charges: {e}")
            pass

        gross_amount = float(doctor_fee) + hospital_charge + bed_charge
        
        discount_percentage = 0
        discount_amount = 0
        
        # Strict Old Patient Discount Logic:
        # Rule: Same Doctor + Within 3 months of previous visit
        
        from datetime import timedelta
        
        # Determine strict eligibility
        is_eligible_for_discount = False
        
        # 1. Get current appointment date
        current_date = appointment.appointment_date
        
        # 2. Calculate 3-month lookback window (90 days)
        cutoff_date = current_date - timedelta(days=90)
        
        # 3. Check for ANY *completed/approved* appointment with SAME doctor in this window
        # excluding the current appointment itself (in case it was saved already)
        # Fix: Include VISITED status and handle same-day appointments with earlier time
        prior_visits_count = Appointment.objects.filter(
            patient=appointment.patient,
            doctor=appointment.doctor,
            status__in=['COMPLETED', 'APPROVED', 'VISITED'], 
            appointment_date__gte=cutoff_date,
        ).exclude(id=appointment.id).filter(
            Q(appointment_date__lt=current_date) | 
            Q(appointment_date=current_date, appointment_time__lt=appointment.appointment_time)
        ).count()
        
        if prior_visits_count > 0:
            is_eligible_for_discount = True
            
        if is_eligible_for_discount:
            discount_percentage = 25
            discount_amount = gross_amount * 0.25
        
        final_amount = gross_amount - discount_amount
        
        return Response({
            'doctor_fee': doctor_fee,
            'hospital_charge': hospital_charge,
            'bed_charge': bed_charge,
            'bed_days': bed_days,
            'bed_charge_per_day': bed_charge_per_day,
            'gross_amount': gross_amount,
            'case_type': appointment.case_type,
            'discount_percentage': discount_percentage,
            'discount_amount': discount_amount,
            'final_amount': final_amount
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrStaff])
    def create_from_appointment(self, request):
        """Create a billing record from an appointment with auto-calculation"""
        appointment_id = request.data.get('appointment_id')
        notes = request.data.get('notes', '')
        
        if not appointment_id:
            return Response(
                {'error': 'appointment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if billing already exists
        if Billing.objects.filter(appointment=appointment).exists():
            return Response(
                {'error': 'Billing already exists for this appointment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate fees logic
        # Calculate fees logic
        doctor_fee = appointment.doctor.consultation_fee
        hospital_charge = float(doctor_fee) * 0.10
        
        # Calculate bed charges
        bed_charge = 0
        bed_days = 0
        bed_charge_per_day = 0
        
        try:
            # Find allocations related to this patient
            # STRICT CHECK: Only consider allocations that haven't been paid for AND are valid
            allocations = appointment.patient.bed_allocations.filter(
                payment_status='PENDING',
                status__in=['ACTIVE', 'DISCHARGED'] # Must be explicitly Active or Discharged
            ).order_by('-admission_date')
            
            if allocations.exists():
                allocation = allocations.first()
                if hasattr(allocation, 'bed') and allocation.bed:
                    start_date = allocation.admission_date
                    end_date = allocation.discharge_date if allocation.discharge_date else timezone.now()
                    
                    # Ensure timezone compatibility
                    if timezone.is_naive(start_date):
                        start_date = timezone.make_aware(start_date)
                    if timezone.is_naive(end_date):
                        end_date = timezone.make_aware(end_date)
                    
                    # Calculate duration
                    duration = end_date - start_date
                    days = duration.days
                    
                    # Minimum 1 day charge
                    if days < 1:
                        days = 1
                        
                    bed_days = days
                    bed_charge_per_day = float(allocation.bed.price_per_day)
                    bed_charge = bed_days * bed_charge_per_day
                    
        except Exception as e:
            print(f"Error calculating bed charges in creation: {e}")
            pass

        gross_amount = float(doctor_fee) + hospital_charge + bed_charge
        
        discount_percentage = 0
        discount_amount = 0
        
        # Strict Old Patient Discount Logic:
        from datetime import timedelta
        
        is_eligible_for_discount = False
        current_date = appointment.appointment_date
        cutoff_date = current_date - timedelta(days=90)
        
        prior_visits_count = Appointment.objects.filter(
            patient=appointment.patient,
            doctor=appointment.doctor,
            status__in=['COMPLETED', 'APPROVED', 'VISITED'], 
            appointment_date__gte=cutoff_date,
        ).exclude(id=appointment.id).filter(
            Q(appointment_date__lt=current_date) | 
            Q(appointment_date=current_date, appointment_time__lt=appointment.appointment_time)
        ).count()
        
        if prior_visits_count > 0:
            discount_percentage = 25
            discount_amount = gross_amount * 0.25
        
        # Also update case_type for record keeping if it was incorrect
        if is_eligible_for_discount and appointment.case_type != 'OLD':
            appointment.case_type = 'OLD'
            appointment.save(update_fields=['case_type'])
        elif not is_eligible_for_discount and appointment.case_type == 'OLD':
             # If strictly not eligible but marked OLD, revert to NEW (or keep as is? 
             # Safe to revert to ensure data consistency with billing)
             appointment.case_type = 'NEW'
             appointment.save(update_fields=['case_type'])
        
        final_amount = gross_amount - discount_amount
        
        invoice_number = f"INV-{''.join(random.choices(string.ascii_uppercase + string.digits, k=8))}"
        
        billing = Billing.objects.create(
            appointment=appointment,
            patient=appointment.patient,
            invoice_number=invoice_number,
            notes=notes,
            payment_status='PENDING',
            
            doctor_fee=doctor_fee,
            hospital_charge=hospital_charge,
            bed_charge=bed_charge,
            bed_days=bed_days,
            bed_charge_per_day=bed_charge_per_day,
            discount_percentage=discount_percentage,
            discount_amount=discount_amount,
            final_amount=final_amount,
            total_amount=gross_amount # Using gross for total, final for payable
        )
        
        # Notify Patient of Bill Generation
        Notification.objects.create(
            user=appointment.patient.user,
            title='Invoice Generated',
            message=f'Invoice #{invoice_number} for ₹{final_amount} has been generated. Please proceed to payment.'
        )

        # Notify Patient if Discount Applied
        if discount_percentage > 0:
            Notification.objects.create(
                user=appointment.patient.user,
                title='Loyalty Discount Applied',
                message=f'A {discount_percentage}% loyalty discount of ₹{discount_amount} has been applied to your bill.'
            )
        
        return Response(
            BillingSerializer(billing).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def print_details(self, request, pk=None):
        """Get details specifically for printing"""
        invoice = self.get_object()
        serializer = BillingSerializer(invoice)
        data = serializer.data
        
        # Flatten structure for easier frontend consumption if needed
        # Or just return serializer data which is already rich
        
        # Ensure we have all needed fields
        response_data = {
            'invoice_number': invoice.invoice_number,
            'date': invoice.created_at,
            'patient': {
                'name': invoice.patient.user.full_name,
                'age': invoice.patient.age,
                'gender': invoice.patient.gender,
                'contact': invoice.patient.contact_number, 
                'address': invoice.patient.address
            },
            'doctor': {
                'name': invoice.appointment.doctor.user.full_name,
                'department': invoice.appointment.doctor.department.name if invoice.appointment.doctor.department else 'General',
            },
            'appointment': {
                'date': invoice.appointment.appointment_date,
                'case_type': invoice.appointment.case_type,
            },
            'billing': {
                'doctor_fee': invoice.doctor_fee,
                'hospital_charge': invoice.hospital_charge,
                'discount_percentage': invoice.discount_percentage,
                'discount_amount': invoice.discount_amount,
                'final_amount': invoice.final_amount, # or total_amount
                'total_amount': invoice.total_amount 
            }
        }
        return Response(response_data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrStaff])
    def mark_paid(self, request, pk=None):
        """Mark billing as paid"""
        from django.db import transaction
        from decimal import Decimal, InvalidOperation
        
        try:
            with transaction.atomic():
                billing = self.get_object()
                
                # Use final_amount like before
                target_amount = billing.final_amount if billing.final_amount > 0 else billing.total_amount
                
                amount_input = request.data.get('amount', target_amount)
                payment_method = request.data.get('payment_method', 'CASH')
                
                try:
                    # Clean string input
                    amount_str = str(amount_input).replace(',', '').replace('$', '').replace('₹', '')
                    amount_decimal = Decimal(amount_str)
                    target_decimal = Decimal(str(target_amount)) # Ensure target is decimal
                except (ValueError, TypeError, InvalidOperation) as e:
                    print(f"Amount conversion error: {e}")
                    amount_decimal = Decimal(str(target_amount))
                    target_decimal = Decimal(str(target_amount))
                
                billing.paid_amount = amount_decimal
                billing.payment_method = payment_method
                
                # Compare with small tolerance for Decimal precision if needed, but Decimal is usually exact
                # Using 0.01 tolerance just in case
                tolerance = Decimal('0.01')
                if amount_decimal >= (target_decimal - tolerance):
                    billing.payment_status = 'PAID'
                else:
                    billing.payment_status = 'PENDING'
                    
                billing.save()
                
                # If fully paid, update associated bed allocation to PAID
                if billing.payment_status == 'PAID':
                    allocations = billing.patient.bed_allocations.filter(
                        payment_status='PENDING'
                    )
                    for allocation in allocations:
                        allocation.payment_status = 'PAID'
                        allocation.save()
                
                # Notify Patient of Payment Completion
                Notification.objects.create(
                    user=billing.patient.user,
                    title='Payment Successful',
                    message=f'Payment of ₹{billing.paid_amount} for Invoice #{billing.invoice_number} has been received. Thank you!'
                )
                
                # Notify Admins
                admins = User.objects.filter(role='ADMIN')
                for admin in admins:
                     Notification.objects.create(
                        user=admin,
                        title='Payment Received',
                        message=f'Payment of ₹{billing.paid_amount} received from {billing.patient.user.full_name} for Invoice #{billing.invoice_number}'
                    )

                return Response({
                    'success': True,
                    'payment_status': billing.payment_status,
                    'message': 'Payment completed successfully',
                    'billing': BillingSerializer(billing).data
                }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f"Payment failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrStaff])
    def cancel(self, request, pk=None):
        """Cancel a billing record"""
        billing = self.get_object()
        billing.payment_status = 'CANCELLED'
        billing.save()
        
        return Response({
            'message': 'Billing cancelled successfully',
            'billing': BillingSerializer(billing).data
        })