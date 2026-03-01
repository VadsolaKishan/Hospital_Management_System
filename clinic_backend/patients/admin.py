from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'date_of_birth', 'gender', 'blood_group', 'created_at']
    list_filter = ['gender', 'blood_group', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_name(self, obj):
        return obj.user.full_name
    get_name.short_description = 'Patient Name'