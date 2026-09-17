from django.db import models
from django.conf import settings

class AuditEvent(models.Model):
    request_id = models.UUIDField(db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    role = models.CharField(max_length=50, blank=True, null=True)
    action = models.CharField(max_length=255, blank=True, null=True)
    method = models.CharField(max_length=10, blank=True, null=True)
    path = models.CharField(max_length=1024, blank=True, null=True)
    status = models.IntegerField(blank=True, null=True)
    resource = models.CharField(max_length=255, blank=True, null=True)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    patient_reference = models.CharField(max_length=255, blank=True, null=True)
    purpose = models.CharField(max_length=255, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_events"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.method} {self.path} [{self.status}]"
