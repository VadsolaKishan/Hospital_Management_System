from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import LabTestType, LabRequest, LabReport
from .serializers import LabTestTypeSerializer, LabRequestSerializer, LabReportSerializer
from accounts.permissions import IsAdmin, IsLabTechnician, IsDoctor


class LabTestTypeViewSet(viewsets.ModelViewSet):
    queryset = LabTestType.objects.all()
    serializer_class = LabTestTypeSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAuthenticated()]
        return [IsAdmin()]


class LabRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LabRequestSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action == "create":
            return [IsDoctor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = LabRequest.objects.select_related(
            "patient__user", "doctor__user", "test", "appointment", "report__technician"
        )
        if user.role == "PATIENT":
            return qs.filter(patient__user=user)
        if user.role == "DOCTOR":
            return qs.filter(doctor__user=user)
        # ADMIN, STAFF, LAB_TECHNICIAN see all
        return qs

    @action(detail=True, methods=["post"])
    def mark_visited(self, request, pk=None):
        lab_request = self.get_object()
        if lab_request.status != "REQUESTED":
            return Response(
                {"error": "Only REQUESTED lab requests can be marked as VISITED"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lab_request.status = "VISITED"
        lab_request.save()
        return Response(LabRequestSerializer(lab_request).data)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload_report(self, request, pk=None):
        lab_request = self.get_object()
        if lab_request.status not in ("VISITED", "REQUESTED"):
            return Response(
                {"error": "Report can only be uploaded for VISITED or REQUESTED requests"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report_file = request.FILES.get("report_file")
        if not report_file:
            # If updating an existing report, allow notes update only if file exists
            if hasattr(lab_request, "report") and lab_request.report.report_file:
                report = lab_request.report
                report.notes = request.data.get("notes", "")
                report.technician = request.user
                report.save()
                lab_request.status = "COMPLETED"
                lab_request.save()
                return Response(LabRequestSerializer(lab_request).data)
            return Response(
                {"error": "Report file is required for new reports."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = request.data.get("notes", "")

        # Create or update report
        report, created = LabReport.objects.update_or_create(
            lab_request=lab_request,
            defaults={
                "report_file": report_file,
                "notes": notes,
                "technician": request.user,
            },
        )

        lab_request.status = "COMPLETED"
        lab_request.save()

        # Send notification to patient
        try:
            from support.models import Notification

            Notification.objects.create(
                user=lab_request.patient.user,
                title="Lab Report Ready",
                message=f"Your {lab_request.test.test_name} report is now available.",
            )
        except Exception:
            pass

        return Response(LabRequestSerializer(lab_request).data)

    @action(detail=False, methods=["get"])
    def patient_reports(self, request):
        """Get lab reports for a specific patient"""
        patient_id = request.query_params.get("patient_id")
        if not patient_id:
            return Response(
                {"error": "patient_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        qs = LabRequest.objects.filter(
            patient_id=patient_id, status="COMPLETED"
        ).select_related(
            "patient__user", "doctor__user", "test", "report__technician"
        )

        # Patients can only view their own reports
        if request.user.role == "PATIENT":
            if not hasattr(request.user, "patient_profile") or str(
                request.user.patient_profile.id
            ) != str(patient_id):
                return Response(
                    {"error": "You can only view your own reports"},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = LabRequestSerializer(qs, many=True)
        return Response(serializer.data)
