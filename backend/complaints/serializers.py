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

    class Meta:
        model = Complaint

        fields = (
            "id",
            "reference_number",
            "title",
            "status",
            "priority",
            "created_at",
        )
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

    class Meta:
        model = Complaint
        fields = (
            "id",
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
            "images",
            "status_history",
            "created_at",
            "updated_at",
        )
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