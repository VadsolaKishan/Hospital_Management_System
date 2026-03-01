from django.contrib import admin
from .models import Billing

@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'get_patient_name', 'total_amount', 'paid_amount', 'balance', 'payment_status', 'payment_method', 'created_at']
    list_filter = ['payment_status', 'payment_method', 'created_at']
    search_fields = ['invoice_number', 'patient__user__email', 'patient__user__full_name']
    readonly_fields = ['created_at', 'updated_at', 'invoice_number', 'balance']
    fieldsets = (
        ('Invoice Information', {
            'fields': ('invoice_number', 'appointment', 'patient')
        }),
        ('Amount Details', {
            'fields': ('total_amount', 'paid_amount', 'balance')
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'payment_method', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_patient_name(self, obj):
        return obj.patient.user.full_name
    get_patient_name.short_description = 'Patient'
    
    def balance(self, obj):
        return obj.total_amount - obj.paid_amount
    balance.short_description = 'Balance Due'
    
    def has_delete_permission(self, request):
        # Prevent accidental deletion of billing records
        return request.user.is_superuser
