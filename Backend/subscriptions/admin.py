from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("tenant", "plan", "status", "started_at", "current_period_end", "cancel_at_period_end")
    list_filter = ("status", "plan")
    search_fields = ("tenant__name", "plan__name")

# Register your models here.
