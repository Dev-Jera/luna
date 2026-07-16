import logging

from django.db import IntegrityError, OperationalError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'error': {
                'code': 'validation_error' if response.status_code == 400 else 'request_error',
                'message': 'Please correct the highlighted information.' if response.status_code == 400 else 'The request could not be completed.',
                'fields': response.data if isinstance(response.data, dict) else {'detail': response.data},
            }
        }
        return response

    request = context.get('request')
    logger.exception('Unhandled API error', extra={'path': getattr(request, 'path', '')})
    if isinstance(exc, IntegrityError):
        return Response({'error': {'code': 'conflict', 'message': 'That account information is already in use.', 'fields': {}}}, status=status.HTTP_409_CONFLICT)
    if isinstance(exc, OperationalError):
        return Response({'error': {'code': 'database_unavailable', 'message': 'Luna cannot reach the database right now. Please try again shortly.', 'fields': {}}}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({'error': {'code': 'server_error', 'message': 'Something went wrong on Luna’s side. Please try again.', 'fields': {}}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
