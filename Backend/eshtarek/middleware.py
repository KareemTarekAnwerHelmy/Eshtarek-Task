from typing import Optional
from django.db import connection
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser

try:
    from accounts.models import UserRole  # type: ignore
except Exception:  # pragma: no cover
    class UserRole:
        ADMIN = "ADMIN"


class TenantContextMiddleware(MiddlewareMixin):
    """
    Sets Postgres session variables per-request for Row-Level Security (RLS):
      - app.tenant_id: UUID of the authenticated user's tenant
      - app.admin: 'true' when platform admin; 'false' otherwise

    Works only on PostgreSQL. On other DBs, does nothing.
    """

    @staticmethod
    def _set_pg_setting(key: str, value: Optional[str]) -> None:
        try:
            with connection.cursor() as cursor:
                if value is None:
                    cursor.execute("SELECT set_config(%s, '', true)", [key])
                else:
                    cursor.execute("SELECT set_config(%s, %s, true)", [key, value])
        except Exception:
            # Non-Postgres or connection not ready; ignore silently.
            pass

    def process_request(self, request):
        user = getattr(request, 'user', AnonymousUser())

        tenant_id_val: Optional[str] = None
        is_admin = False

        if getattr(user, 'is_authenticated', False):
            profile = getattr(user, 'profile', None)
            if profile and getattr(profile, 'tenant_id', None):
                tenant_id_val = str(profile.tenant_id)
            # Platform admin detection: role ADMIN or Django superuser
            try:
                if profile and getattr(profile, 'role', None) == getattr(UserRole, 'ADMIN', 'ADMIN'):
                    is_admin = True
            except Exception:
                pass
            if getattr(user, 'is_superuser', False):
                is_admin = True

        # Set or clear per-request PG settings
        self._set_pg_setting('app.tenant_id', tenant_id_val)
        self._set_pg_setting('app.admin', 'true' if is_admin else 'false')

        return None
