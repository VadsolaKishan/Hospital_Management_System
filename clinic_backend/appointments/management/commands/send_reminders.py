from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from appointments.models import Appointment
from support.models import Notification

class Command(BaseCommand):
    help = 'Send appointment reminders 1 day before'

    def handle(self, *args, **kwargs):
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Find appointments for tomorrow with PENDING or APPROVED status
        appointments = Appointment.objects.filter(
            appointment_date=tomorrow,
            status__in=['PENDING', 'APPROVED']
        )
        
        count = 0
        for apt in appointments:
            # Check if reminder already sent? 
            # Simple check: if notification exists for this user with similar title today?
            # Or just send it. The command runs once a day ideally.
            
            Notification.objects.create(
                user=apt.patient.user,
                title='Appointment Reminder',
                message=f'Reminder: You have an appointment tomorrow with Dr. {apt.doctor.user.full_name} at {apt.appointment_time}.'
            )
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Sent {count} reminders for {tomorrow}'))
