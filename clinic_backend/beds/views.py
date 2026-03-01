from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Ward, Bed, BedAllocation, BedRequest
from .serializers import WardSerializer, BedSerializer, BedAllocationSerializer, BedRequestSerializer
from django.utils import timezone
from accounts.permissions import IsAdminOrStaff

class WardViewSet(viewsets.ModelViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'ward_type']

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter]
    search_fields = ['bed_number', 'ward__name', 'bed_type']
    
    def get_queryset(self):
        queryset = Bed.objects.all()
        ward_id = self.request.query_params.get('ward', None)
        status_param = self.request.query_params.get('status', None)
        
        if ward_id:
            queryset = queryset.filter(ward_id=ward_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        return queryset

class BedAllocationViewSet(viewsets.ModelViewSet):
    queryset = BedAllocation.objects.all()
    serializer_class = BedAllocationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter]
    search_fields = ['patient__user__full_name', 'bed__bed_number']

    @action(detail=True, methods=['post'])
    def discharge(self, request, pk=None):
        allocation = self.get_object()
        if allocation.status == 'DISCHARGED':
            return Response({'error': 'Patient already discharged'}, status=status.HTTP_400_BAD_REQUEST)
            
        discharge_date_str = request.data.get('discharge_date')
        if not discharge_date_str:
            return Response({'error': 'Discharge date is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from django.utils.dateparse import parse_datetime, parse_date
            import datetime
            
            discharge_date = parse_datetime(discharge_date_str)
            if discharge_date:
                if timezone.is_naive(discharge_date):
                    discharge_date = timezone.make_aware(discharge_date)
            else:
                # Try parsing as date and combine with current time or min time
                d_date = parse_date(discharge_date_str)
                if d_date:
                    discharge_date = timezone.make_aware(datetime.datetime.combine(d_date, datetime.datetime.now().time()))
                else:
                    return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validation
        if discharge_date < allocation.admission_date:
            return Response({'error': 'Discharge date cannot be before admission date'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update allocation status
        allocation.status = 'DISCHARGED'
        allocation.discharge_date = discharge_date
        # Payment status remains PENDING until paid
        allocation.save()
        
        # Free up the bed immediately so it can be used
        bed = allocation.bed
        bed.status = 'AVAILABLE'
        bed.save()
        
        return Response({'status': 'Patient discharged successfully. Payment pending.'})

class BedRequestViewSet(viewsets.ModelViewSet):
    queryset = BedRequest.objects.all()
    serializer_class = BedRequestSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    filter_backends = [filters.SearchFilter]
    search_fields = ['patient__user__full_name', 'doctor__user__full_name']
    
    def get_queryset(self):
        qs = BedRequest.objects.all().select_related('patient__user', 'doctor__user')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs
