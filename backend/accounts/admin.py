from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, OTP


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = (
        "id",
        "email",
        "phone",
        "full_name",
        "is_ngo",
        "ngo_name",
        "is_staff",
        "is_active",
    )

    search_fields = ("email", "phone", "full_name", "ngo_name")
    ordering = ("id",)

    fieldsets = (
        (None, {"fields": ("email", "phone", "password")}),
        ("Personal Info", {"fields": ("full_name",)}),
        ("Location", {"fields": ("state", "district")}),
        ("NGO Partner Info", {"fields": ("is_ngo", "ngo_name")}),
        ("Verification", {"fields": ("is_email_verified", "is_phone_verified")}),
        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
        ("Important Dates", {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "phone",
                "full_name",
                "password1",
                "password2",
                "is_staff",
                "is_active",
            ),
        }),
    )


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "phone",
        "purpose",
        "otp",
        "is_used",
        "expires_at",
    )

    list_filter = ("purpose", "is_used")
    search_fields = ("phone",)