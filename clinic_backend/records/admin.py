from django.contrib import admin
from .models import Prescription

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'diagnosis', 'created_at']
    list_filter = ['created_at']
    search_fields = ['patient__user__email', 'doctor__user__email', 'diagnosis']
    readonly_fields = ['created_at', 'updated_at']
    
    def patient(self, obj):
        return obj.patient.user.full_name
    
    def doctor(self, obj):
        return f"Dr. {obj.doctor.user.full_name}"