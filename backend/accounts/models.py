from django.contrib.auth.models import AbstractUser
from django.db import models
from .managers import UserManager



class User(AbstractUser):
    # Remove username field
    username = None

    # Basic Information
    first_name = None
    last_name = None

    full_name = models.CharField(max_length=150)

    email = models.EmailField(
        unique=True,
        null=True,
        blank=True
    )

    phone = models.CharField(
        max_length=15,
        unique=True,
        null=True,
        blank=True
    )

    # Verification
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    # Location for Geo-fencing & Local Resident Verification
    state = models.ForeignKey('locations.State', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    district = models.ForeignKey('locations.District', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

    # NGO Partner Account Fields
    is_ngo = models.BooleanField(default=False, help_text="Designates if this user account is a verified NGO partner")
    ngo_name = models.CharField(max_length=150, blank=True, help_text="Name of verified NGO partner organization")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    # Login field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        if self.email:
            return self.email
        return self.phone
    
class OTP(models.Model):

    PURPOSE_CHOICES = [
        ("REGISTER", "Register"),
        ("LOGIN", "Login"),
        ("RESET_PASSWORD", "Reset Password"),
        ("VERIFY_PHONE", "Verify Phone"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="otps",
        null=True,
        blank=True
    )

    phone = models.CharField(max_length=15)

    otp = models.CharField(max_length=6)

    purpose = models.CharField(
        max_length=20,
        choices=PURPOSE_CHOICES
    )

    is_used = models.BooleanField(default=False)

    expires_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.phone} - {self.purpose}"