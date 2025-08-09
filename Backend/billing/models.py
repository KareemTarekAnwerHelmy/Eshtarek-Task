from django.db import models
from django.utils import timezone

from tenants.models import Tenant
from subscriptions.models import Subscription


class InvoiceStatus(models.TextChoices):
    DUE = "due", "Due"
    PAID = "paid", "Paid"
    VOID = "void", "Void"


class Invoice(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="invoices")
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name="invoices")
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default="USD")
    status = models.CharField(max_length=10, choices=InvoiceStatus.choices, default=InvoiceStatus.DUE)
    period_start = models.DateTimeField(null=True, blank=True)
    period_end = models.DateTimeField(null=True, blank=True)
    issued_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issued_at"]

    def __str__(self) -> str:
        return f"Invoice {self.id} - {self.tenant.name} - {self.amount_cents/100:.2f} {self.currency} [{self.status}]"


class PaymentStatus(models.TextChoices):
    SUCCEEDED = "succeeded", "Succeeded"
    FAILED = "failed", "Failed"


class Payment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    amount_cents = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.SUCCEEDED)
    provider_ref = models.CharField(max_length=100, blank=True, default="mock_txn")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Payment {self.id} -> Invoice {self.invoice_id} [{self.status}]"
