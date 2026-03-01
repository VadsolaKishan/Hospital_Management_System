# accounts/permissions.py

from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """
    Permission check for ADMIN role
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ADMIN'


class IsDoctor(BasePermission):
    """
    Permission check for DOCTOR role
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'DOCTOR'


class IsStaff(BasePermission):
    """
    Permission check for STAFF role
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'STAFF'


class IsPatient(BasePermission):
    """
    Permission check for PATIENT role
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'PATIENT'


class IsAdminOrStaff(BasePermission):
    """
    Permission check for ADMIN or STAFF roles
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'STAFF']


class IsAdminOrDoctor(BasePermission):
    """
    Permission check for ADMIN or DOCTOR roles
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['ADMIN', 'DOCTOR']