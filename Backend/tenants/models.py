from django.db import models
import uuid


class Tenant(models.Model):
    """Represents a business/customer using the platform.

    Uses a UUID primary key to be opaque and safe to expose in URLs.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

# Create your models here.
