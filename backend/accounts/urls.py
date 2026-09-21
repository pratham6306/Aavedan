from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ForgotPasswordView, GoogleAuthView, LoginView, LogoutView, ProfileView, RegisterView, ResetPasswordView, SendOTPView, UpdateLocationView, VerifyOTPView

urlpatterns = [
    re_path(r"^register/?$", RegisterView.as_view(), name="register"),
    re_path(r"^login/?$", LoginView.as_view(), name="login"),
    re_path(r"^google/?$", GoogleAuthView.as_view(), name="google_auth"),
    re_path(r"^token/refresh/?$", TokenRefreshView.as_view(), name="token_refresh"),
    re_path(r"^profile/?$", ProfileView.as_view(), name="profile"),
    re_path(r"^update-location/?$", UpdateLocationView.as_view(), name="update-location"),
    re_path(r"^forgot-password/?$", ForgotPasswordView.as_view(), name="forgot-password"),
    re_path(r"^reset-password/?$", ResetPasswordView.as_view(), name="reset-password"),
    re_path(r"^send-otp/?$", SendOTPView.as_view(), name="send-otp"),
    re_path(r"^verify-otp/?$", VerifyOTPView.as_view(), name="verify-otp"),
    re_path(r"^logout/?$", LogoutView.as_view(), name="logout"),   
]