from rest_framework import serializers
from .models import Subscription
from tenants.models import Tenant
from plans.models import Plan


class SubscriptionSerializer(serializers.ModelSerializer):
    tenant = serializers.PrimaryKeyRelatedField(read_only=True)
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all())

    class Meta:
        model = Subscription
        fields = (
            'id', 'tenant', 'plan', 'status', 'started_at', 'current_period_end', 'cancel_at_period_end', 'created_at', 'updated_at'
        )
        read_only_fields = ('status', 'started_at', 'created_at', 'updated_at')


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    tenant = serializers.PrimaryKeyRelatedField(queryset=Tenant.objects.all(), required=False)
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all())

    class Meta:
        model = Subscription
        fields = ('tenant', 'plan')


class SubscriptionChangePlanSerializer(serializers.Serializer):
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.all())
