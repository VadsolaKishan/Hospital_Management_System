from django.core.management.base import BaseCommand
from laboratory.models import LabTestType
from accounts.models import User


DEFAULT_TESTS = [
    {"test_name": "CBC", "description": "Complete Blood Count", "price": 300},
    {"test_name": "Blood Sugar", "description": "Fasting/PP Blood Sugar Test", "price": 150},
    {"test_name": "Urine Test", "description": "Routine Urine Examination", "price": 200},
    {"test_name": "X-Ray", "description": "Digital X-Ray Imaging", "price": 500},
    {"test_name": "MRI", "description": "Magnetic Resonance Imaging", "price": 5000},
    {"test_name": "Thyroid Test", "description": "Thyroid Function Test (T3, T4, TSH)", "price": 600},
]


class Command(BaseCommand):
    help = "Seed default lab test types and create lab technician user"

    def handle(self, *args, **options):
        # Seed lab test types
        created_count = 0
        for test_data in DEFAULT_TESTS:
            _, created = LabTestType.objects.get_or_create(
                test_name=test_data["test_name"],
                defaults={
                    "description": test_data["description"],
                    "price": test_data["price"],
                },
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Lab test types: {created_count} created, {len(DEFAULT_TESTS) - created_count} already existed")
        )

        # Create lab technician user
        email = "lab@admin.com"
        if not User.objects.filter(email=email).exists():
            user = User(
                email=email,
                first_name="Lab",
                last_name="Technician",
                role="LAB_TECHNICIAN",
                is_active=True,
            )
            user.set_password("lab123")
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Lab technician user created: {email}"))
        else:
            self.stdout.write(self.style.WARNING(f"Lab technician user already exists: {email}"))
