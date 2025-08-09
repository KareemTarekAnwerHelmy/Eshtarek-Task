from django.contrib import admin
from .models import Invoice, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "subscription", "amount_cents", "status", "issued_at", "paid_at")
    list_filter = ("status", "currency", "issued_at")
    search_fields = ("tenant__name",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "invoice", "amount_cents", "status", "provider_ref", "created_at")
    list_filter = ("status",)
