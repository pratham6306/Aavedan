from rest_framework import serializers

from .models import (
    Complaint,
    ComplaintImage,
    ComplaintStatus,
)
class ComplaintStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = ComplaintStatus
        fields = (
            "id",
            "name",
            "order",
        )
class ComplaintImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ComplaintImage
        fields = (
            "id",
            "image",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
        )
class ComplaintCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Complaint

        fields = (
            "title",
            "description",
            "address",
            "landmark",
            "state",
            "district",
            "category",
            "department",
            "latitude",
            "longitude",
            "is_anonymous",
        )

    def validate(self, attrs):
        district = attrs.get("district")
        state = attrs.get("state")

        if district.state != state:
            raise serializers.ValidationError(
                "District does not belong to the selected state."
            )

        return attrs
class ComplaintListSerializer(serializers.ModelSerializer):

    status = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    district = serializers.StringRelatedField()
    state = serializers.StringRelatedField()
    complainant_name = serializers.SerializerMethodField()
    supports_count = serializers.SerializerMethodField()
    supported_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Complaint

        fields = (
            "id",
            "reference_number",
            "title",
            "status",
            "priority",
            "department",
            "district",
            "state",
            "complainant_name",
            "supports_count",
            "supported_by_user",
            "is_anonymous",
            "created_at",
        )

    def get_complainant_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Citizen"
        return obj.user.full_name or obj.user.email or "Citizen"

    def get_supports_count(self, obj):
        return obj.supports.count()

    def get_supported_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.supports.filter(user=user).exists()
        return False


class ComplaintStatusHistorySerializer(serializers.ModelSerializer):
    old_status = serializers.StringRelatedField()
    new_status = serializers.StringRelatedField()

    class Meta:
        from .models import ComplaintStatusHistory
        model = ComplaintStatusHistory
        fields = (
            "id",
            "old_status",
            "new_status",
            "remarks",
            "created_at",
        )


class ComplaintDetailSerializer(serializers.ModelSerializer):
    status = ComplaintStatusSerializer(read_only=True)
    images = ComplaintImageSerializer(many=True, read_only=True)
    department = serializers.StringRelatedField()
    category = serializers.StringRelatedField()
    state = serializers.StringRelatedField()
    district = serializers.StringRelatedField()
    status_history = ComplaintStatusHistorySerializer(many=True, read_only=True)
    complainant_name = serializers.SerializerMethodField()
    supports_count = serializers.SerializerMethodField()
    supported_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = (
            "id",
            "user",
            "reference_number",
            "title",
            "description",
            "address",
            "landmark",
            "state",
            "district",
            "category",
            "department",
            "department_office",
            "status",
            "priority",
            "latitude",
            "longitude",
            "ai_summary",
            "ai_confidence",
            "is_ai_processed",
            "is_anonymous",
            "complainant_name",
            "supports_count",
            "supported_by_user",
            "images",
            "status_history",
            "created_at",
            "updated_at",
        )

    def get_complainant_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous Citizen"
        return obj.user.full_name or obj.user.email or "Citizen"

    def get_supports_count(self, obj):
        return obj.supports.count()

    def get_supported_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.supports.filter(user=user).exists()
        return False
class ComplaintUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Complaint

        fields = (
            "title",
            "description",
            "address",
            "landmark",
            "category",
            "department",
            "latitude",
            "longitude",
        )

    def validate(self, attrs):
        return attrs