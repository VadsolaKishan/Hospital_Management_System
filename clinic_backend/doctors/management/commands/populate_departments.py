from django.core.management.base import BaseCommand
from doctors.models import Department

class Command(BaseCommand):
    help = 'Populates the database with default hospital departments'

    def handle(self, *args, **kwargs):
        departments = [
            {
                "name": "General Medicine",
                "description": "Primary care for adults, focusing on prevention, diagnosis, and treatment of diseases."
            },
            {
                "name": "Cardiology",
                "description": "Diagnosis and treatment of heart and blood vessel disorders."
            },
            {
                "name": "Neurology",
                "description": "Diagnosis and treatment of disorders of the nervous system."
            },
            {
                "name": "Orthopedics",
                "description": "Diagnosis, correction, prevention, and treatment of skeletal deformities."
            },
            {
                "name": "Pediatrics",
                "description": "Medical care of infants, children, and adolescents."
            },
            {
                "name": "Gynecology & Obstetrics",
                "description": "Health of the female reproductive systems and care during pregnancy/childbirth."
            },
            {
                "name": "Dermatology",
                "description": "Diagnosis and treatment of skin, hair, and nail conditions."
            },
            {
                "name": "Ophthalmology",
                "description": "Diagnosis and treatment of eye disorders."
            },
            {
                "name": "ENT (Otorhinolaryngology)",
                "description": "Diagnosis and treatment of ear, nose, and throat disorders."
            },
            {
                "name": "Dental",
                "description": "Diagnosis, prevention, and treatment of diseases and conditions of the oral cavity."
            },
            {
                "name": "Psychiatry",
                "description": "Diagnosis, prevention, and treatment of mental diorders."
            },
            {
                "name": "General Surgery",
                "description": "Surgical treatment of abdominal contents including esophagus, stomach, small bowel, colon, liver, pancreas, gallbladder, appendix and bile ducts."
            },
            {
                "name": "Oncology",
                "description": "Prevention, diagnosis, and treatment of cancer."
            },
            {
                "name": "Radiology",
                "description": "Use of medical imaging to generally diagnose and treat diseases within the body."
            },
            {
                "name": "Pathology",
                "description": "Study of the causes and effects of disease or injury."
            },
            {
                "name": "Emergency Medicine",
                "description": "Care of illnesses or injuries requiring immediate medical attention."
            },
            {
                "name": "Urology",
                "description": "Surgical and medical diseases of the male and female urinary-tract system."
            },
             {
                "name": "Nephrology",
                "description": " diagnosis and treatment of kidney diseases."
            }
        ]

        created_count = 0
        for dept_data in departments:
            dept, created = Department.objects.get_or_create(
                name=dept_data['name'],
                defaults={'description': dept_data['description']}
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created department: {dept.name}'))
            else:
                self.stdout.write(f'Department already exists: {dept.name}')

        self.stdout.write(self.style.SUCCESS(f'Successfully added {created_count} new departments.'))
