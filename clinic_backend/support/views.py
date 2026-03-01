from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, Query
from .serializers import NotificationSerializer, QuerySerializer
from accounts.permissions import IsAdmin

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related('user')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)


class QueryViewSet(viewsets.ModelViewSet):
    serializer_class = QuerySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Query.objects.all().select_related('user')
        return Query.objects.filter(user=user).select_related('user')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reply(self, request, pk=None):
        """Admin reply to query"""
        query = self.get_object()
        reply = request.data.get('reply')
        
        if not reply:
            return Response({'error': 'Reply is required'}, status=400)
        
        query.admin_reply = reply
        query.status = 'RESOLVED'
        query.save()
        
        # Create notification for user
        Notification.objects.create(
            user=query.user,
            title='Query Response',
            message=f'Your query "{query.subject}" has been responded to'
        )
        
        return Response({'message': 'Reply sent successfully'})