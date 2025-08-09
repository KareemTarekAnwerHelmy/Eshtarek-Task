from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from tenants.models import Tenant
from subscriptions.models import Subscription, SubscriptionStatus
from .models import UserProfile, UserRole
from .serializers import UserRegistrationSerializer, UserProfileSerializer

# Create your views here.

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data["username"]
        email = serializer.validated_data.get("email")
        password = serializer.validated_data["password"]
        tenant_id = serializer.validated_data["tenant_id"]
        role = serializer.validated_data.get("role", UserRole.TENANT_USER)

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response({"detail": "Invalid tenant_id"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce usage limit based on active subscription plan (if any)
        if not request.user.is_superuser:
            sub = (
                Subscription.objects.filter(tenant=tenant, status=SubscriptionStatus.ACTIVE)
                .select_related("plan")
                .first()
            )
            if sub and sub.plan and sub.plan.max_users:
                current_users = UserProfile.objects.filter(tenant=tenant).count()
                if current_users >= sub.plan.max_users:
                    return Response({
                        "detail": "Max users limit reached for the tenant's current plan"
                    }, status=status.HTTP_403_FORBIDDEN)

        user = User(username=username, email=email)
        user.set_password(password)
        user.save()

        profile = UserProfile.objects.create(user=user, tenant=tenant, role=role)

        return Response(UserProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        if not profile:
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserProfileSerializer(profile).data)
