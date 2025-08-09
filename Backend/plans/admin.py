from django.contrib import admin
from .models import Plan


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price_cents", "interval", "max_users", "active", "created_at")
    list_filter = ("interval", "active")
    search_fields = ("name",)

# Register your models here.
