from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from appointments.models import Appointment
from records.models import Prescription

class Command(BaseCommand):
    help = 'Create test prescriptions for completed appointments'

    def handle(self, *args, **options):
        # Get completed appointments without prescriptions
        appointments = Appointment.objects.filter(
            status='COMPLETED',
            prescriptions__isnull=True
        ).distinct()

        if not appointments.exists():
            # If no completed appointments, create some test prescriptions from recent appointments
            appointments = Appointment.objects.all()[:3]
            if not appointments.exists():
                self.stdout.write(
                    self.style.WARNING('No appointments found. Please create appointments first.')
                )
                return

        count = 0
        for appointment in appointments:
            # Check if prescription already exists
            if Prescription.objects.filter(appointment=appointment).exists():
                continue

            # Create prescription
            prescription = Prescription.objects.create(
                appointment=appointment,
                patient=appointment.patient,
                doctor=appointment.doctor,
                diagnosis=f"Based on symptoms described: {appointment.reason[:100]}...",
                medications="1. Paracetamol 500mg - 2 tablets twice daily for 5 days\n2. Ibuprofen 400mg - 1 tablet after meals if needed\n3. Multivitamin - 1 tablet daily for 15 days",
                instructions="Take medications as prescribed. Drink plenty of water. Rest for at least 2-3 hours daily. Avoid heavy foods and oily items.",
                follow_up_date=timezone.now().date() + timedelta(days=7)
            )
            count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Created prescription for {appointment.patient.user.full_name}'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully created {count} test prescriptions!')
        )
