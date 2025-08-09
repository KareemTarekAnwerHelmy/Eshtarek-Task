from django.db import models


class BillingInterval(models.TextChoices):
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


class Plan(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    price_cents = models.PositiveIntegerField(default=0)
    interval = models.CharField(max_length=10, choices=BillingInterval.choices, default=BillingInterval.MONTHLY)
    max_users = models.PositiveIntegerField(default=1)
    features = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["price_cents", "name"]

    def __str__(self) -> str:
        interval = self.get_interval_display()
        price = f"${self.price_cents/100:.2f}/{interval.lower()}"
        return f"{self.name} ({price})"

# Create your models here.
