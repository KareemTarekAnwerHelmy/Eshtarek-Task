# Eshtarek — Multi-Tenant Subscription Management System

A prototype platform to manage multi-tenant subscriptions with tenant isolation, plans, subscriptions, billing simulation, and a React frontend.

## Stack
- Backend: Django + DRF + JWT
- DB: PostgreSQL
- Frontend: React (Vite)
- CI/CD: Docker (Dockerfiles + docker-compose)

## Features
- JWT auth (login/register/logout)
- Tenants, Plans, Subscriptions
- Tenant-level isolation (middleware + Postgres RLS)
- Role-based UI (Platform Admin vs Tenant users)
- Billing simulation (invoices, pay action)

## Quickstart (Docker)
```bash
# From repo root
docker compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# Postgres: localhost:5432 (eshtarek/eshtarek)
```
The compose sets `VITE_API_BASE=http://backend:8000/api` for the frontend.

## Local Dev
### Backend
```bash
# In Backend/
python -m venv .venv && .venv/Scripts/activate  # Windows PowerShell equivalent
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Make sure Postgres is running and Django has DB credentials configured via env.

### Frontend
```bash
# In Frontend/
npm ci
npm run dev
# Vite dev server http://localhost:5173 (proxy /api -> http://localhost:8000)
```

## Environment Variables
- Backend (examples via docker-compose.yml)
  - DATABASE_URL=postgresql://eshtarek:eshtarek@db:5432/eshtarek
  - ALLOWED_HOSTS=*
  - CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
- Frontend
  - VITE_API_BASE (for Docker build/preview), defaults to `/api` in dev

## API Overview (selected)
- Auth:
  - POST `/api/auth/token/`
  - POST `/api/auth/token/refresh/`
  - POST `/api/auth/token/verify/`
- Accounts:
  - POST `/api/accounts/register/`
  - GET `/api/accounts/me/`
- Plans: CRUD `/api/plans/`
- Tenants: CRUD `/api/tenants/`
- Subscriptions: `/api/subscriptions/`
  - POST `/api/subscriptions/{id}/change-plan/` (admin/tenant admin)
  - POST `/api/subscriptions/{id}/change-status/` (admin/tenant admin)
- Billing:
  - GET/POST `/api/billing/` (create invoice)
  - POST `/api/billing/{invoice_id}/pay/`

## Frontend Routes
- `/` Home (public view + richer authenticated overview)
- `/login`, `/register`
- `/plans` (public list)
- `/dashboard`, `/subscriptions`, `/invoices` (auth)
- `/admin/plans`, `/admin/tenants`, `/admin/subscriptions` (platform admin only)

## Test Flow
1) Login as platform admin → see Admin links in nav.
2) Create Tenant(s) and Plans (or use existing).
3) Create a Subscription for a tenant (API or existing data).
4) Register tenant users:
   - Admin sees tenant dropdown on Register page
   - Non-admin uses tenant UUID input (validated)
5) Login as tenant user → view Subscriptions and Invoices.
6) Invoices page: select subscription → Create Invoice → Pay Invoice.
7) Change plan on Subscriptions page using the dropdown per row.

## Notes
- Tokens are stored in localStorage; a global axios interceptor auto-logs out on 401.
- Frontend uses a luxury dark theme (`src/styles.css`).
- Dockerfile linter may show base image CVE warnings. For production hardening:
  - Serve the frontend with nginx (static) instead of vite preview
  - Run containers as non-root
  - Pin/upgrade base images

### Database Isolation: Postgres vs MySQL
- Row-Level Security (RLS) is enforced in Postgres via per-table policies and request-scoped tenant context middleware.
- MySQL does not support native RLS; if you switch to MySQL, isolation will rely on application-layer filtering. Document and test carefully.

### Billing Logic
- Invoice amounts are sourced from the subscription's plan `price_cents` at time of creation.
- No proration or annual/monthly toggles are applied by default. Extend the logic if needed (e.g., period handling, proration on plan change).

## License
For evaluation and demo purposes.
