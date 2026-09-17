from django.core.management.base import BaseCommand
from accounts.models import User
from patients.models import Patient
from records.models import Prescription
from billing.models import Billing
from laboratory.models import LabReport
from beds.models import BedAllocation
from support.models import Query
from clinic_backend.crypto import encrypt_val, decrypt_val, get_fernet


class Command(BaseCommand):
    help = "Encrypt existing unencrypted plaintext records in the database."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting encryption of existing database records..."))
        fernet = get_fernet()

        # 1. User records (phone)
        users = User.objects.all()
        user_count = 0
        for user in users:
            if user.phone and not self._is_encrypted(user.phone, fernet):
                # Triggering save will run get_prep_value and encrypt phone
                user.save(update_fields=["phone"])
                user_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted {user_count} User phone fields."))

        # 2. Patient records
        patients = Patient.objects.all()
        patient_count = 0
        for patient in patients:
            fields_to_update = []
            if patient.address and not self._is_encrypted(patient.address, fernet):
                fields_to_update.append("address")
            if patient.emergency_contact and not self._is_encrypted(patient.emergency_contact, fernet):
                fields_to_update.append("emergency_contact")
            if patient.medical_history and not self._is_encrypted(patient.medical_history, fernet):
                fields_to_update.append("medical_history")
            if patient.allergies and not self._is_encrypted(patient.allergies, fernet):
                fields_to_update.append("allergies")

            if fields_to_update:
                patient.save(update_fields=fields_to_update)
                patient_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted fields for {patient_count} Patient records."))

        # 3. Prescription records
        prescriptions = Prescription.objects.all()
        prescription_count = 0
        for p in prescriptions:
            fields_to_update = []
            if p.diagnosis and not self._is_encrypted(p.diagnosis, fernet):
                fields_to_update.append("diagnosis")
            if p.medications and not self._is_encrypted(p.medications, fernet):
                fields_to_update.append("medications")
            if p.instructions and not self._is_encrypted(p.instructions, fernet):
                fields_to_update.append("instructions")

            if fields_to_update:
                p.save(update_fields=fields_to_update)
                prescription_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted fields for {prescription_count} Prescription records."))

        # 4. Billing records
        billings = Billing.objects.all()
        billing_count = 0
        for b in billings:
            if b.notes and not self._is_encrypted(b.notes, fernet):
                b.save(update_fields=["notes"])
                billing_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted {billing_count} Billing notes fields."))

        # 5. LabReport records
        reports = LabReport.objects.all()
        report_count = 0
        for r in reports:
            if r.notes and not self._is_encrypted(r.notes, fernet):
                r.save(update_fields=["notes"])
                report_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted {report_count} LabReport notes fields."))

        # 6. BedAllocation records
        allocations = BedAllocation.objects.all()
        alloc_count = 0
        for a in allocations:
            fields_to_update = []
            if a.reason and not self._is_encrypted(a.reason, fernet):
                fields_to_update.append("reason")
            if a.notes and not self._is_encrypted(a.notes, fernet):
                fields_to_update.append("notes")

            if fields_to_update:
                a.save(update_fields=fields_to_update)
                alloc_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted fields for {alloc_count} BedAllocation records."))

        # 7. Query records
        queries = Query.objects.all()
        query_count = 0
        for q in queries:
            fields_to_update = []
            if q.message and not self._is_encrypted(q.message, fernet):
                fields_to_update.append("message")
            if q.admin_reply and not self._is_encrypted(q.admin_reply, fernet):
                fields_to_update.append("admin_reply")

            if fields_to_update:
                q.save(update_fields=fields_to_update)
                query_count += 1
        self.stdout.write(self.style.SUCCESS(f"Encrypted fields for {query_count} Query records."))

        self.stdout.write(self.style.SUCCESS("Existing records encryption process completed successfully."))

    def _is_encrypted(self, value, fernet):
        if not value:
            return True
        try:
            fernet.decrypt(str(value).encode("utf-8"))
            return True
        except Exception:
            return False
