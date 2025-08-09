from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsPlatformAdmin(BasePermission):
    """Allow only platform admins (User.is_superuser or UserProfile.role == ADMIN)."""

    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, 'is_authenticated', False):
            return False
        if getattr(user, 'is_superuser', False):
            return True
        profile = getattr(user, 'profile', None)
        return bool(profile and getattr(profile, 'role', '') == 'ADMIN')


class IsTenantAdminOrReadOnly(BasePermission):
    """Read-only for authenticated; write only for tenant admins or platform admins."""

    def has_permission(self, request, view):
        user = request.user
        if request.method in SAFE_METHODS:
            return True
        if not getattr(user, 'is_authenticated', False):
            return False
        if getattr(user, 'is_superuser', False):
            return True
        profile = getattr(user, 'profile', None)
        return bool(profile and getattr(profile, 'role', '') in ('ADMIN', 'TENANT_ADMIN'))
