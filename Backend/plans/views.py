from rest_framework import viewsets, permissions
from .models import Plan
from .serializers import PlanSerializer


class IsPlatformAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not getattr(user, 'is_authenticated', False):
            return False
        if getattr(user, 'is_superuser', False):
            return True
        profile = getattr(user, 'profile', None)
        return bool(profile and getattr(profile, 'role', '') == 'ADMIN')


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(active=True).order_by('price_cents')
    serializer_class = PlanSerializer

    # Allow read for any authenticated user; write restricted to platform admin
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]  # public read
        return [IsPlatformAdminOrReadOnly()]

# Create your views here.
