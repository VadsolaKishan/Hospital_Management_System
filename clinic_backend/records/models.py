from django.db import models
from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient

class Prescription(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='prescriptions')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    diagnosis = models.TextField()
    medications = models.TextField()
    instructions = models.TextField(blank=True, null=True)
    follow_up_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Bed Request Fields
    bed_required = models.BooleanField(default=False)
    expected_bed_days = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'prescriptions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Prescription for {self.patient.user.full_name} by Dr. {self.doctor.user.full_name}"
    
    @property
    def billing(self):
        """Get associated billing record through appointment"""
        try:
            from billing.models import Billing
            return Billing.objects.get(appointment=self.appointment)
        except:
            return None