import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db.models.deletion import ProtectedError

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    if isinstance(exc, ProtectedError):
        return Response(
            {
                "error": "This item cannot be deleted because it is referenced by other important records (e.g. patient history).",
                "detail": "Protected records exist."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Call REST framework's default exception handler first to get standard error responses
    response = exception_handler(exc, context)

    # If response is None, it's an unhandled exception (e.g., 500 Internal Server Error)
    if response is None:
        request = context.get('request')
        request_id = getattr(request, 'request_id', 'unknown')

        # Log the full stack trace internally. NEVER expose this to the client.
        logger.error(
            f"Unhandled Exception [Request ID: {request_id}]: {str(exc)}\n{traceback.format_exc()}"
        )

        # Return a safe, sanitized JSON response
        return Response(
            {
                "error": "Unable to process request",
                "request_id": request_id
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
