from django.contrib import admin
from .models import Department, Doctor, DoctorSlot

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['get_name', 'department', 'specialization', 'consultation_fee', 'is_available']
    list_filter = ['department', 'is_available', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'specialization']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_name(self, obj):
        return f"Dr. {obj.user.full_name}"
    get_name.short_description = 'Doctor Name'


@admin.register(DoctorSlot)
class DoctorSlotAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'weekday', 'start_time', 'end_time', 'is_active']
    list_filter = ['weekday', 'is_active']
    search_fields = ['doctor__user__first_name', 'doctor__user__last_name']