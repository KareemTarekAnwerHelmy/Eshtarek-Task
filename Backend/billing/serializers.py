from rest_framework import serializers
from .models import Invoice, Payment
from plans.models import Plan
from subscriptions.models import Subscription


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "amount_cents", "status", "provider_ref", "created_at")
        read_only_fields = ("status", "provider_ref", "created_at")


class InvoiceSerializer(serializers.ModelSerializer):
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "tenant",
            "subscription",
            "amount_cents",
            "currency",
            "status",
            "period_start",
            "period_end",
            "issued_at",
            "paid_at",
            "created_at",
            "updated_at",
            "payments",
        )
        read_only_fields = ("tenant", "amount_cents", "status", "issued_at", "paid_at", "created_at", "updated_at")


class InvoiceCreateSerializer(serializers.Serializer):
    subscription = serializers.PrimaryKeyRelatedField(queryset=Subscription.objects.select_related("tenant", "plan"))


class PayInvoiceSerializer(serializers.Serializer):
    amount_cents = serializers.IntegerField(min_value=1, required=False)
