from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from accounts.models import User


@receiver(post_save, sender=User)
def create_patient_profile(sender, instance, created, **kwargs):
    """
    Automatically create a Patient profile when a User with role PATIENT is created
    """
    if created and instance.role == 'PATIENT':
        from patients.models import Patient

        # Only create if patient profile doesn't already exist
        if not Patient.objects.filter(user=instance).exists():
            Patient.objects.create(
                user=instance,
                date_of_birth=timezone.now().date(),
                gender='M',
            )


@receiver(post_save, sender=User)
def create_doctor_profile(sender, instance, created, **kwargs):
    """
    Optionally create a Doctor profile when a User with role DOCTOR is created
    Note: This requires department selection, so it's better to do this manually
    """
    pass
