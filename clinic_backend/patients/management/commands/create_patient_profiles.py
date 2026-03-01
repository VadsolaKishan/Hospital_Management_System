from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from patients.models import Patient


class Command(BaseCommand):
    help = 'Create patient profiles for all PATIENT users that do not have one'

    def handle(self, *args, **options):
        patient_users = User.objects.filter(role='PATIENT')
        created_count = 0

        for user in patient_users:
            try:
                # Check if patient profile exists
                user.patient_profile
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Patient profile already exists for {user.email}')
                )
            except Patient.DoesNotExist:
                # Create patient profile with default values
                patient = Patient.objects.create(
                    user=user,
                    date_of_birth=timezone.now().date(),
                    gender='M',  # Default, should be updated by user
                )
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created patient profile for {user.email}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Total profiles created: {created_count}')
        )
