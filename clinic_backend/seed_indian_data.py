import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinic_backend.settings')
django.setup()

from accounts.models import User
from doctors.models import Doctor, Department, DoctorSlot
from patients.models import Patient
import random

def seed_data():
    # Indian Doctors Data
    doctors_data = [
        {"first_name": "Ramesh", "last_name": "Sharma", "email": "ramesh.sharma@hospital.com", "spec": "Cardiologist", "dept": "Cardiology"},
        {"first_name": "Priya", "last_name": "Patel", "email": "priya.patel@hospital.com", "spec": "Neurologist", "dept": "Neurology"},
        {"first_name": "Amit", "last_name": "Singh", "email": "amit.singh@hospital.com", "spec": "Orthopedic Surgeon", "dept": "Orthopedics"},
        {"first_name": "Sunita", "last_name": "Rao", "email": "sunita.rao@hospital.com", "spec": "Pediatrician", "dept": "Pediatrics"},
        {"first_name": "Vikram", "last_name": "Malhotra", "email": "vikram.malhotra@hospital.com", "spec": "General Physician", "dept": "General Medicine"},
    ]

    # Indian Patients Data
    patients_data = [
        {"first_name": "Rahul", "last_name": "Verma", "email": "rahul.verma@gmail.com", "phone": "9876543210", "gender": "M", "blood": "B+"},
        {"first_name": "Sneha", "last_name": "Gupta", "email": "sneha.gupta@gmail.com", "phone": "9876543211", "gender": "F", "blood": "O+"},
        {"first_name": "Karan", "last_name": "Joshi", "email": "karan.joshi@gmail.com", "phone": "9876543212", "gender": "M", "blood": "A+"},
        {"first_name": "Anjali", "last_name": "Desai", "email": "anjali.desai@gmail.com", "phone": "9876543213", "gender": "F", "blood": "AB+"},
        {"first_name": "Rohan", "last_name": "Mehta", "email": "rohan.mehta@gmail.com", "phone": "9876543214", "gender": "M", "blood": "O-"},
    ]

    print("Creating Doctors...")
    for doc in doctors_data:
        user, created = User.objects.get_or_create(
            email=doc["email"],
            defaults={
                "first_name": doc["first_name"],
                "last_name": doc["last_name"],
                "role": "DOCTOR",
                "phone": f"99{random.randint(10000000, 99999999)}"
            }
        )
        if created:
            user.set_password("Password@123")
            user.save()

        dept = Department.objects.filter(name=doc["dept"]).first()
        
        doctor, doc_created = Doctor.objects.get_or_create(
            user=user,
            defaults={
                "department": dept,
                "specialization": doc["spec"],
                "qualification": "MBBS, MD",
                "experience_years": random.randint(5, 25),
                "consultation_fee": Decimal(random.choice([500, 800, 1000, 1200, 1500])),
                "license_number": f"MCI-{random.randint(10000, 99999)}",
                "bio": f"Experienced {doc['spec']} based in India.",
            }
        )
        if doc_created:
            print(f"  Created Doctor: Dr. {doc['first_name']} {doc['last_name']}")

    print("\nCreating Patients...")
    for pat in patients_data:
        user, created = User.objects.get_or_create(
            email=pat["email"],
            defaults={
                "first_name": pat["first_name"],
                "last_name": pat["last_name"],
                "role": "PATIENT",
                "phone": pat["phone"]
            }
        )
        if created:
            user.set_password("Password@123")
            user.save()

        patient, pat_created = Patient.objects.get_or_create(
            user=user,
            defaults={
                "gender": pat["gender"],
                "blood_group": pat["blood"],
                "address": "Mumbai, Maharashtra, India",
                "emergency_contact": f"98{random.randint(10000000, 99999999)}"
            }
        )
        if pat_created:
            print(f"  Created Patient: {pat['first_name']} {pat['last_name']}")

    print("\nSeed completed successfully!")

if __name__ == '__main__':
    seed_data()
