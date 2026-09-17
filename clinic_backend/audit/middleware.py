import uuid
import logging
from django.utils.deprecation import MiddlewareMixin
from .models import AuditEvent

logger = logging.getLogger(__name__)

class AuditMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 1. Generate unique Request ID
        request.request_id = str(uuid.uuid4())
        return None

    def process_response(self, request, response):
        # 2. Append X-Request-ID to response
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id

        # 3. Log AuditEvent safely
        try:
            user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            role = user.role if user and hasattr(user, 'role') else None
            
            # Basic resource heuristic from URL
            path_parts = [p for p in request.path.split('/') if p]
            resource = path_parts[1] if len(path_parts) > 1 else 'unknown'
            resource_id = path_parts[2] if len(path_parts) > 2 and path_parts[2].isdigit() else None
            
            patient_reference = request.GET.get('patient_id') or request.GET.get('patient')
            purpose = request.GET.get('purpose')

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
                
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            AuditEvent.objects.create(
                request_id=request.request_id if hasattr(request, 'request_id') else str(uuid.uuid4()),
                user=user,
                role=role,
                method=request.method,
                path=request.path,
                action=request.method,
                status=response.status_code,
                resource=resource,
                resource_id=resource_id,
                patient_reference=patient_reference,
                purpose=purpose,
                ip_address=ip,
                user_agent=user_agent
            )
        except Exception as e:
            # Audit failures must never stop hospital operations
            logger.error(f"Failed to record audit event: {str(e)}")

        return response
