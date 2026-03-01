from django.db import models
from accounts.models import User

class Patient(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    BLOOD_GROUP_CHOICES = [('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'), 
                           ('O+', 'O+'), ('O-', 'O-'), ('AB+', 'AB+'), ('AB-', 'AB-')]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=15, blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    uhid = models.CharField(max_length=20, unique=True, null=True, blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patients'
    
    def __str__(self):
        return f"{self.user.full_name} - {self.uhid or 'New'}"

    def save(self, *args, **kwargs):
        if not self.uhid:
            import datetime
            now = datetime.datetime.now()
            year = now.year
            # Find last patient from this year to increment sequence
            last_patient = Patient.objects.filter(uhid__startswith=f'HMS-{year}-').order_by('-id').first()
            if last_patient and last_patient.uhid:
                try:
                    last_seq = int(last_patient.uhid.split('-')[-1])
                    new_seq = last_seq + 1
                except ValueError:
                    new_seq = Patient.objects.filter(created_at__year=year).count() + 1
            else:
                new_seq = Patient.objects.filter(created_at__year=year).count() + 1
            
            self.uhid = f'HMS-{year}-{new_seq:06d}'
            
            # Simple collision check (retry once if needed, though unlikely with serialized saves)
            if Patient.objects.filter(uhid=self.uhid).exists():
                new_seq += 1
                self.uhid = f'HMS-{year}-{new_seq:06d}'
                
        super().save(*args, **kwargs)