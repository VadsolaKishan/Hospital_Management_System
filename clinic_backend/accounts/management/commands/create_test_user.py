from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create a test user for development'

    def handle(self, *args, **options):
        # Create test user if it doesn't exist
        if User.objects.filter(email='test@clinic.com').exists():
            User.objects.filter(email='test@clinic.com').delete()
            self.stdout.write(self.style.WARNING('Deleted existing test user'))

        user = User.objects.create_user(
            email='test@clinic.com',
            first_name='Test',
            last_name='User',
            password='Test@1234',
            role='PATIENT',
            is_active=True
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created test user: {user.email}')
        )
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Password: Test@1234')
        self.stdout.write(f'Role: {user.role}')
