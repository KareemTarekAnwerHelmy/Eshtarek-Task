from rest_framework import serializers
from .models import Plan


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = (
            'id', 'name', 'description', 'price_cents', 'interval', 'max_users', 'features', 'active', 'created_at'
        )
