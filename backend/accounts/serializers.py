from rest_framework import serializers
from .models import User, OTP


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = (
            "full_name",
            "email",
            "phone",
            "password",
        )

    def validate(self, attrs):
        email = attrs.get("email")
        phone = attrs.get("phone")

        if not email and not phone:
            raise serializers.ValidationError(
                "Either email or phone is required."
            )

        return attrs

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Email is already registered."
            )
        return value

    def validate_phone(self, value):
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "Phone number is already registered."
            )
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("identifier")
        password = attrs.get("password")

        # Check whether identifier is email or phone
        if "@" in identifier:
            user = User.objects.filter(email=identifier).first()
        else:
            user = User.objects.filter(phone=identifier).first()

        if user is None:
            raise serializers.ValidationError(
                "Invalid email/phone or password."
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                "Invalid email/phone or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "User account is inactive."
            )

        attrs["user"] = user
        return attrs


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)

    def validate_phone(self, value):
        if not User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "User with this phone number does not exist."
            )
        return value

class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        phone = attrs["phone"]

        if not User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                "User with this phone number does not exist."
            )

        return attrs
    
class ForgotPasswordSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)

    def validate_phone(self, value):
        if not User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "User with this phone number does not exist."
            )
        return value

class ResetPasswordSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    def validate(self, attrs):
        phone = attrs["phone"]

        if not User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                "User with this phone number does not exist."
            )

        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    total_complaints = serializers.SerializerMethodField()
    resolved_complaints = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "phone",
            "is_email_verified",
            "is_phone_verified",
            "created_at",
            "total_complaints",
            "resolved_complaints",
        )
        read_only_fields = (
            "id",
            "is_email_verified",
            "is_phone_verified",
            "created_at",
            "total_complaints",
            "resolved_complaints",
        )

    def get_total_complaints(self, obj):
        return obj.complaints.filter(is_deleted=False).count()

    def get_resolved_complaints(self, obj):
        return obj.complaints.filter(is_deleted=False, status__name__iexact="resolved").count()

    def validate_email(self, value):
        user = self.instance

        if (
            value
            and User.objects.filter(email=value)
            .exclude(id=user.id)
            .exists()
        ):
            raise serializers.ValidationError(
                "Email already exists."
            )
        return value

    def validate_phone(self, value):
        user = self.instance

        if (
            value
            and User.objects.filter(phone=value)
            .exclude(id=user.id)
            .exists()
        ):
            raise serializers.ValidationError(
                "Phone number already exists."
            )
        return value

# class UpdateProfileSerializer(serializers.ModelSerializer):

#     class Meta:
#         model = User

#         fields = (
#             "full_name",
#             "email",
#             "phone",
#         )

#     def validate_email(self, value):
#         user = self.instance

#         if (
#             value
#             and User.objects.filter(email=value)
#             .exclude(id=user.id)
#             .exists()
#         ):
#             raise serializers.ValidationError(
#                 "Email already exists."
#             )

#         return value

#     def validate_phone(self, value):
#         user = self.instance

#         if (
#             value
#             and User.objects.filter(phone=value)
#             .exclude(id=user.id)
#             .exists()
#         ):
#             raise serializers.ValidationError(
#                 "Phone already exists."
#             )

#         return value