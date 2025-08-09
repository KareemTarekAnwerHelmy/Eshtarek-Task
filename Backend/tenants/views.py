from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Tenant
from .serializers import TenantSerializer
from accounts.permissions import IsPlatformAdmin


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all().order_by('name')
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated & IsPlatformAdmin]

# Create your views here.
