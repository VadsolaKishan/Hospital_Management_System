from django.db import models
from appointments.models import Appointment
from patients.models import Patient

class Billing(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled')
    ]
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
        ('INSURANCE', 'Insurance')
    ]
    
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='billing')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='billings')
    
    # Fee breakdown
    doctor_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hospital_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bed_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bed_days = models.IntegerField(default=0)
    bed_charge_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percentage = models.IntegerField(default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Final amounts (total_amount usually means the final payable in existing logic, so we keep it logic-aligned)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2) # Gross amount (fee + charge)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Payable after discount
    
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    invoice_number = models.CharField(max_length=50, unique=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.patient.user.full_name}"
    
    @property
    def prescriptions(self):
        """Get all prescriptions for this billing's appointment"""
        return self.appointment.prescriptions.all()
    
    @property
    def balance(self):
        """Calculate remaining balance"""
        return self.final_amount - self.paid_amount