from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'appointment_date', 'appointment_time', 'status', 'created_at']
    list_filter = ['status', 'appointment_date', 'created_at']
    search_fields = ['patient__user__email', 'doctor__user__email', 'reason']
    readonly_fields = ['created_at', 'updated_at']
    
    def patient(self, obj):
        return obj.patient.user.full_name
    
    def doctor(self, obj):
        return f"Dr. {obj.doctor.user.full_name}"