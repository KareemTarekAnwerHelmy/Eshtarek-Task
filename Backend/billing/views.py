from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsTenantAdminOrReadOnly
from .models import Invoice, Payment, InvoiceStatus, PaymentStatus
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PayInvoiceSerializer,
    PaymentSerializer,
)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("tenant", "subscription", "subscription__plan").prefetch_related("payments")
    serializer_class = InvoiceSerializer
    permission_classes = [IsTenantAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return qs
        profile = getattr(user, 'profile', None)
        if profile and getattr(profile, 'role', '') == 'ADMIN':
            return qs
        if profile and getattr(profile, 'tenant_id', None):
            return qs.filter(tenant_id=profile.tenant_id)
        return qs.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def perform_create(self, serializer):
        subscription = serializer.validated_data['subscription']
        amount = subscription.plan.price_cents
        invoice = Invoice.objects.create(
            tenant=subscription.tenant,
            subscription=subscription,
            amount_cents=amount,
            currency="USD",
            status=InvoiceStatus.DUE,
            period_start=timezone.now(),
            period_end=None,
        )
        # return is ignored by DRF; set for response in create()
        self.instance = invoice

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(InvoiceSerializer(self.instance).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == InvoiceStatus.PAID:
            return Response({"detail": "Invoice already paid"}, status=status.HTTP_400_BAD_REQUEST)
        pay_ser = PayInvoiceSerializer(data=request.data)
        pay_ser.is_valid(raise_exception=True)
        amount = pay_ser.validated_data.get('amount_cents') or invoice.amount_cents
        payment = Payment.objects.create(
            invoice=invoice,
            amount_cents=amount,
            status=PaymentStatus.SUCCEEDED,
            provider_ref="mock_txn",
        )
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "paid_at", "updated_at"])
        return Response({
            "invoice": InvoiceSerializer(invoice).data,
            "payment": PaymentSerializer(payment).data,
        }, status=status.HTTP_200_OK)
