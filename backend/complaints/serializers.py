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
    category = serializers.StringRelatedField()
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
            "description",
            "address",
            "landmark",
            "status",
            "priority",
            "category",
            "department",
            "district",
            "state",
            "complainant_name",
            "supports_count",
            "supported_by_user",
            "is_anonymous",
            "estimated_cost",
            "budget_allocated",
            "after_image",
            "resolution_remarks",
            "is_verified_resolved",
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
            "estimated_cost",
            "budget_allocated",
            "after_image",
            "resolution_remarks",
            "resolved_at",
            "verified_at",
            "is_verified_resolved",
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


class DepartmentBudgetSerializer(serializers.ModelSerializer):
    department = serializers.StringRelatedField()
    district = serializers.StringRelatedField()
    state = serializers.StringRelatedField()

    class Meta:
        from .models import DepartmentBudget
        model = DepartmentBudget
        fields = (
            "id",
            "department",
            "district",
            "state",
            "fiscal_year",
            "allocated_budget",
            "spent_budget",
        )


class CivicProjectResolutionProofSerializer(serializers.ModelSerializer):
    verified_count = serializers.SerializerMethodField()
    rejected_count = serializers.SerializerMethodField()
    verified_by_user = serializers.SerializerMethodField()
    rejected_by_user = serializers.SerializerMethodField()
    complaint_title = serializers.SerializerMethodField()

    class Meta:
        from .models import CivicProjectResolutionProof
        model = CivicProjectResolutionProof
        fields = (
            "id",
            "project",
            "complaint",
            "complaint_title",
            "image",
            "remarks",
            "verified_count",
            "rejected_count",
            "verified_by_user",
            "rejected_by_user",
            "is_rejected",
            "rejection_reason",
            "created_at",
        )

    def get_verified_count(self, obj):
        return obj.verified_by.count()

    def get_rejected_count(self, obj):
        return obj.rejected_by.count()

    def get_verified_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.verified_by.filter(id=user.id).exists()
        return False

    def get_rejected_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.rejected_by.filter(id=user.id).exists()
        return False

    def get_complaint_title(self, obj):
        return obj.complaint.title if obj.complaint else None


class CivicProjectSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    department = serializers.StringRelatedField()
    district = serializers.StringRelatedField()
    state = serializers.StringRelatedField()
    complaints_count = serializers.SerializerMethodField()
    resolved_complaints_count = serializers.SerializerMethodField()
    votes_count = serializers.SerializerMethodField()
    voted_by_user = serializers.SerializerMethodField()
    verifications_count = serializers.SerializerMethodField()
    verified_by_user = serializers.SerializerMethodField()
    rejections_count = serializers.SerializerMethodField()
    rejected_by_user = serializers.SerializerMethodField()
    resolution_proofs = CivicProjectResolutionProofSerializer(many=True, read_only=True)

    class Meta:
        from .models import CivicProject
        model = CivicProject
        fields = (
            "id",
            "title",
            "category",
            "department",
            "district",
            "state",
            "ward_name",
            "estimated_cost",
            "allocated_budget",
            "status",
            "after_image",
            "resolution_remarks",
            "rejected_image",
            "rejected_remarks",
            "is_rejected",
            "complaints_count",
            "resolved_complaints_count",
            "votes_count",
            "voted_by_user",
            "verifications_count",
            "verified_by_user",
            "rejections_count",
            "rejected_by_user",
            "resolution_proofs",
            "created_at",
        )

    def get_complaints_count(self, obj):
        return obj.complaints.count()

    def get_resolved_complaints_count(self, obj):
        return obj.complaints.filter(status__name__iexact="resolved").count()

    def get_votes_count(self, obj):
        return obj.votes.count()

    def get_voted_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.votes.filter(user=user).exists()
        return False

    def get_verifications_count(self, obj):
        return obj.verified_by.count()

    def get_verified_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.verified_by.filter(id=user.id).exists()
        return False

    def get_rejections_count(self, obj):
        return obj.rejected_by.count()

    def get_rejected_by_user(self, obj):
        user = self.context.get('request') and self.context['request'].user
        if user and user.is_authenticated:
            return obj.rejected_by.filter(id=user.id).exists()
        return False


class CivicProjectDetailSerializer(CivicProjectSerializer):
    complaints = ComplaintListSerializer(many=True, read_only=True)

    class Meta(CivicProjectSerializer.Meta):
        fields = CivicProjectSerializer.Meta.fields + ("complaints",)
