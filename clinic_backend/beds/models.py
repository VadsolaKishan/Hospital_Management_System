from django.db import models
from patients.models import Patient
from appointments.models import Appointment
from doctors.models import Doctor

class Ward(models.Model):
    WARD_TYPES = [
        ('GENERAL', 'General Ward'),
        ('ICU', 'Intensive Care Unit'),
        ('PRIVATE', 'Private Room'),
        ('SEMI_PRIVATE', 'Semi-Private Room'),
        ('EMERGENCY', 'Emergency Ward'),
        ('MATERNITY', 'Maternity Ward'),
        ('PEDIATRIC', 'Pediatric Ward'),
    ]

    name = models.CharField(max_length=100)
    ward_type = models.CharField(max_length=20, choices=WARD_TYPES)
    floor_number = models.CharField(max_length=10)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_ward_type_display()})"
    
    @property
    def total_beds(self):
        return self.beds.count()
    
    @property
    def available_beds(self):
        return self.beds.filter(status='AVAILABLE').count()

class Bed(models.Model):
    BED_TYPES = [
        ('STANDARD', 'Standard Bed'),
        ('ADJUSTABLE', 'Adjustable Bed'),
        ('ICU', 'ICU Bed'),
        ('VENTILATOR', 'Bed with Ventilator'),
        ('PEDIATRIC', 'Pediatric Bed'),
    ]
    
    BED_STATUS = [
        ('AVAILABLE', 'Available'),
        ('OCCUPIED', 'Occupied'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('CLEANING', 'Needs Cleaning'),
    ]

    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name='beds')
    bed_number = models.CharField(max_length=20)
    bed_type = models.CharField(max_length=20, choices=BED_TYPES, default='STANDARD')
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=BED_STATUS, default='AVAILABLE')
    is_active = models.BooleanField(default=True)
    
    # Optional: Direct link to current admission for easy access
    # current_allocation = models.OneToOneField('BedAllocation', null=True, blank=True, related_name='active_bed_ref', on_delete=models.SET_NULL)

    class Meta:
        unique_together = ['ward', 'bed_number']

    def __str__(self):
        return f"{self.ward.name} - {self.bed_number}"

class BedAllocation(models.Model):
    ALLOCATION_STATUS = [
        ('ACTIVE', 'Active'),
        ('DISCHARGED', 'Discharged'),
    ]

    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
    ]

    bed = models.ForeignKey(Bed, on_delete=models.PROTECT, related_name='allocations')
    patient = models.ForeignKey(Patient, on_delete=models.PROTECT, related_name='bed_allocations')
    admission_date = models.DateTimeField(auto_now_add=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=ALLOCATION_STATUS, default='ACTIVE')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.patient} - {self.bed} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Determine if this is a new allocation
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        if is_new and self.status == 'ACTIVE':
            # Update bed status to OCCUPIED
            self.bed.status = 'OCCUPIED'
            self.bed.save()

class BedRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='bed_requests')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='bed_requests')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='bed_requests')
    expected_bed_days = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bed Request for {self.patient.user.full_name} ({self.expected_bed_days} days)"

    class Meta:
        ordering = ['-created_at']
