from .models import Complaint, ComplaintImage, ComplaintStatus
from ai.services.knowledge_retriever import KnowledgeRetriever

_kr = KnowledgeRetriever()

class ComplaintService:

    @staticmethod
    def calculate_estimated_cost(title="", description="", category=None):
        text = f"{title} {description}"
        kr_res = _kr.retrieve(text)
        if kr_res and kr_res.get("estimated_cost"):
            return kr_res["estimated_cost"]
        return 25000.00

    @staticmethod
    def create_complaint(*, user, validated_data):
        # Resolve initial status for the new complaint
        status, _ = ComplaintStatus.objects.get_or_create(
            name="pending",
            defaults={"order": 1, "description": "Awaiting review"}
        )

        title = validated_data.get("title", "")
        desc = validated_data.get("description", "")
        kr_res = _kr.retrieve(f"{title} {desc}")

        if "estimated_cost" not in validated_data or not validated_data.get("estimated_cost"):
            validated_data["estimated_cost"] = kr_res.get("estimated_cost", 25000.00)

        if "priority" not in validated_data or not validated_data.get("priority"):
            validated_data["priority"] = kr_res.get("priority", "HIGH").upper()

        complaint = Complaint.objects.create(
            user=user,
            status=status,
            **validated_data,
        )

        return complaint
    @staticmethod
    def upload_images(*, complaint, images):
        for image in images:
            ci = ComplaintImage(
                complaint=complaint,
                image=image,
            )
            ci.save()
    @staticmethod
    def update_complaint(
        *,
        complaint,
        validated_data,
    ):
        for field, value in validated_data.items():
            setattr(
                complaint,
                field,
                value,
            )

        complaint.save()

        return complaint
    @staticmethod
    def delete_complaint(complaint,):
        complaint.is_deleted = True
        complaint.save(
            update_fields=["is_deleted"]
        )
    @staticmethod
    def mark_ai_processed(
        complaint,
        *,
        category,
        department,
        office,
        priority,
        summary,
        confidence,
    ):
        complaint.category = category
        complaint.department = department
        complaint.department_office = office
        complaint.priority = priority
        complaint.ai_summary = summary
        complaint.ai_confidence = confidence
        complaint.is_ai_processed = True

        complaint.save()