from django.db import models
from django.conf import settings
from tenants.models import Tenant


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"           # Platform admin
    TENANT_ADMIN = "TENANT_ADMIN", "Tenant Admin"
    TENANT_USER = "TENANT_USER", "Tenant User"


class UserProfile(models.Model):
    """Extends auth user with tenant membership and role."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    tenant = models.ForeignKey(Tenant, on_delete=models.PROTECT, related_name="users")
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.TENANT_USER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "tenant")

    def __str__(self) -> str:
        return f"{self.user.username} @ {self.tenant.name} ({self.role})"

# Create your models here.
