from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsTenantAdminOrReadOnly
from .models import Invoice, Payment, InvoiceStatus, PaymentStatus
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PayInvoiceSerializer,
    PaymentSerializer,
    WebhookSerializer,
)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("tenant", "subscription", "subscription__plan").prefetch_related("payments")
    serializer_class = InvoiceSerializer
    permission_classes = [IsTenantAdminOrReadOnly]

    def get_permissions(self):
        # Allow any authenticated tenant member to create and pay invoices; other writes remain admin-only
        if self.action in ['create', 'pay']:
            return [permissions.IsAuthenticated()]
        return [perm() for perm in self.permission_classes]

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
        # Ownership check for non-admins: invoice can only be created for a subscription in user's tenant
        user = self.request.user
        if not getattr(user, 'is_superuser', False):
            profile = getattr(user, 'profile', None)
            role = getattr(getattr(profile, 'role', None), 'value', None) or getattr(profile, 'role', None)
            is_tenant_admin = role in ('ADMIN', 'TENANT_ADMIN')
            if not is_tenant_admin and (not profile or getattr(profile, 'tenant_id', None) != subscription.tenant_id):
                raise PermissionDenied("Not allowed for this tenant")
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

    @action(detail=True, methods=['post'], url_path='pay', permission_classes=[permissions.IsAuthenticated])
    def pay(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == InvoiceStatus.PAID:
            return Response({"detail": "Invoice already paid"}, status=status.HTTP_400_BAD_REQUEST)
        pay_ser = PayInvoiceSerializer(data=request.data)
        pay_ser.is_valid(raise_exception=True)
        amount = pay_ser.validated_data.get('amount_cents') or invoice.amount_cents

        # Idempotency-Key support (Stripe-like)
        idem_key = request.headers.get('Idempotency-Key') or request.headers.get('idempotency-key')
        if idem_key:
            existing = invoice.payments.filter(idempotency_key=idem_key).first()
            if existing:
                # Return previous result
                paid = (invoice.status == InvoiceStatus.PAID)
                return Response({
                    "invoice": InvoiceSerializer(invoice).data,
                    "payment": PaymentSerializer(existing).data,
                    "idempotent": True,
                }, status=status.HTTP_200_OK if paid else status.HTTP_202_ACCEPTED)

        simulate = pay_ser.validated_data.get('simulate')
        if simulate == 'fail':
            payment = Payment.objects.create(
                invoice=invoice,
                amount_cents=amount,
                status=PaymentStatus.FAILED,
                provider_ref="mock_txn_failed",
                idempotency_key=idem_key,
            )
            # invoice stays DUE
            return Response({
                "invoice": InvoiceSerializer(invoice).data,
                "payment": PaymentSerializer(payment).data,
                "simulated": "fail",
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        # Default: succeed
        payment = Payment.objects.create(
            invoice=invoice,
            amount_cents=amount,
            status=PaymentStatus.SUCCEEDED,
            provider_ref="mock_txn",
            idempotency_key=idem_key,
        )
        invoice.status = InvoiceStatus.PAID
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "paid_at", "updated_at"])
        return Response({
            "invoice": InvoiceSerializer(invoice).data,
            "payment": PaymentSerializer(payment).data,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='webhooks/mock', permission_classes=[permissions.IsAuthenticated])
    def webhooks_mock(self, request):
        """Mock endpoint to simulate provider webhooks."""
        ser = WebhookSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        event_type = ser.validated_data['type']
        invoice = ser.validated_data['invoice']
        amount = ser.validated_data.get('amount_cents') or invoice.amount_cents

        if event_type == 'payment_intent.failed':
            payment = Payment.objects.create(
                invoice=invoice,
                amount_cents=amount,
                status=PaymentStatus.FAILED,
                provider_ref="mock_webhook_failed",
            )
            return Response({
                "event": event_type,
                "invoice": InvoiceSerializer(invoice).data,
                "payment": PaymentSerializer(payment).data,
            }, status=status.HTTP_200_OK)

        # payment_intent.succeeded
        if invoice.status != InvoiceStatus.PAID:
            payment = Payment.objects.create(
                invoice=invoice,
                amount_cents=amount,
                status=PaymentStatus.SUCCEEDED,
                provider_ref="mock_webhook_succeeded",
            )
            invoice.status = InvoiceStatus.PAID
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=["status", "paid_at", "updated_at"])
        else:
            payment = invoice.payments.order_by('-id').first()

        return Response({
            "event": event_type,
            "invoice": InvoiceSerializer(invoice).data,
            "payment": PaymentSerializer(payment).data if payment else None,
        }, status=status.HTTP_200_OK)
