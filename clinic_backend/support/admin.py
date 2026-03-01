from django.contrib import admin
from .models import Notification, Query

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['title', 'user__email']
    readonly_fields = ['created_at']


@admin.register(Query)
class QueryAdmin(admin.ModelAdmin):
    list_display = ['subject', 'user', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['subject', 'user__email', 'message']
    readonly_fields = ['created_at', 'updated_at']