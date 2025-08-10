from django.shortcuts import render
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Subscription, SubscriptionStatus
from .serializers import (
    SubscriptionSerializer,
    SubscriptionCreateSerializer,
    SubscriptionChangePlanSerializer,
    SubscriptionChangeStatusSerializer,
)
from accounts.permissions import IsTenantAdminOrReadOnly, IsPlatformAdmin

# Create your views here.

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsTenantAdminOrReadOnly]

    def get_queryset(self):
        qs = Subscription.objects.select_related('tenant', 'plan').all()
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
        if self.action in ['create']:
            return SubscriptionCreateSerializer
        if self.action in ['change_plan']:
            return SubscriptionChangePlanSerializer
        if self.action in ['change_status']:
            return SubscriptionChangeStatusSerializer
        return SubscriptionSerializer

    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        tenant = serializer.validated_data['tenant'] if 'tenant' in serializer.validated_data else getattr(profile, 'tenant', None)
        # enforce one active subscription per tenant
        if Subscription.objects.filter(tenant=tenant, status=SubscriptionStatus.ACTIVE).exists():
            raise serializers.ValidationError({
                'tenant': ['This tenant already has an active subscription.']
            })
        # allow optional initial status; default to ACTIVE
        status_value = serializer.validated_data.get('status', SubscriptionStatus.ACTIVE)
        from django.db import IntegrityError
        try:
            serializer.save(tenant=tenant, status=status_value)
        except IntegrityError:
            raise serializers.ValidationError({
                'non_field_errors': ['A subscription with this tenant and status already exists.']
            })

    @action(detail=True, methods=['post'], url_path='change-plan', permission_classes=[IsTenantAdminOrReadOnly])
    def change_plan(self, request, pk=None):
        sub = self.get_object()
        serializer = SubscriptionChangePlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sub.plan = serializer.validated_data['plan']
        sub.save(update_fields=['plan', 'updated_at'])
        return Response(SubscriptionSerializer(sub).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='change-status', permission_classes=[IsTenantAdminOrReadOnly])
    def change_status(self, request, pk=None):
        sub = self.get_object()
        serializer = SubscriptionChangeStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sub.status = serializer.validated_data['status']
        sub.save(update_fields=['status', 'updated_at'])
        return Response(SubscriptionSerializer(sub).data, status=status.HTTP_200_OK)
