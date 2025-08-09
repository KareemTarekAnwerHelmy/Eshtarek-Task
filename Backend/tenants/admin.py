from django.contrib import admin
from .models import Tenant


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "active", "created_at", "id")
    list_filter = ("active",)
    search_fields = ("name", "id")

# Register your models here.
