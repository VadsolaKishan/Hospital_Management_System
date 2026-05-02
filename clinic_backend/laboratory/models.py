from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField
from appointments.models import Appointment
from doctors.models import Doctor
from patients.models import Patient


class LabTestType(models.Model):
    test_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lab_test_types"
        ordering = ["test_name"]

    def __str__(self):
        return self.test_name


class LabRequest(models.Model):
    STATUS_CHOICES = [
        ("REQUESTED", "Requested"),
        ("VISITED", "Visited"),
        ("COMPLETED", "Completed"),
    ]

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="lab_requests"
    )
    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="lab_requests"
    )
    appointment = models.ForeignKey(
        Appointment, on_delete=models.CASCADE, related_name="lab_requests"
    )
    test = models.ForeignKey(
        LabTestType, on_delete=models.CASCADE, related_name="lab_requests"
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="REQUESTED"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lab_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.test.test_name} for {self.patient.user.full_name}"


class LabReport(models.Model):
    lab_request = models.OneToOneField(
        LabRequest, on_delete=models.CASCADE, related_name="report"
    )
    report_file = CloudinaryField("lab_report", resource_type="image", folder="lab_reports")
    notes = models.TextField(blank=True, default="")
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_reports",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lab_reports"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Report for {self.lab_request.test.test_name} - {self.lab_request.patient.user.full_name}"
