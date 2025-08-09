from typing import Optional
from uuid import UUID
from django.contrib.auth.models import User
from rest_framework import serializers

from tenants.models import Tenant
from .models import UserProfile, UserRole


class UserRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(allow_blank=True, required=False)
    password = serializers.CharField(write_only=True, min_length=6)
    tenant_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=UserRole.choices, required=False, default=UserRole.TENANT_USER)


class TenantNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ("id", "name", "active")


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "is_active")


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserNestedSerializer(read_only=True)
    tenant = TenantNestedSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ("user", "tenant", "role", "created_at")
