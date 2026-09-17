from django.db import models
from accounts.models import User
from clinic_backend.fields import EncryptedTextField



class Notification(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.user.email}"


class Query(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("IN_PROGRESS", "In Progress"),
        ("RESOLVED", "Resolved"),
        ("CLOSED", "Closed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="queries")
    subject = models.CharField(max_length=200)
    message = EncryptedTextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="OPEN")
    admin_reply = EncryptedTextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "queries"
        ordering = ["-created_at"]
        verbose_name_plural = "Queries"

    def __str__(self):
        return f"{self.subject} - {self.user.email}"
