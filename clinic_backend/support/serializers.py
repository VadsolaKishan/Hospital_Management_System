from rest_framework import serializers
from .models import Notification, Query

class NotificationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'user_name', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['user', 'created_at']


class QuerySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Query
        fields = ['id', 'user', 'user_name', 'user_email', 'subject', 'message', 'status', 
                  'admin_reply', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']