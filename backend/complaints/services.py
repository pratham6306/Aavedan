from .models import Complaint, ComplaintImage, ComplaintStatus

class ComplaintService:

    @staticmethod
    def calculate_estimated_cost(title="", description="", category=None):
        text = (f"{title} {description}").lower()
        if any(w in text for w in ["bridge", "flyover", "highway", "overhaul", "stormwater"]):
            return 450000.00
        elif any(w in text for w in ["road", "pothole", "broken", "sadak", "gadda", "street", "blockage"]):
            return 125000.00
        elif any(w in text for w in ["transformer", "electricity", "power", "bijli", "voltage"]):
            return 85000.00
        elif any(w in text for w in ["water", "pipeline", "paani", "sewage", "naali", "leakage"]):
            return 55000.00
        elif any(w in text for w in ["garbage", "kachra", "sanitation", "cleanliness"]):
            return 22000.00
        elif any(w in text for w in ["light", "streetlight", "lamp"]):
            return 15000.00
        return 35000.00

    @staticmethod
    def create_complaint(*, user, validated_data):
        # Resolve initial status for the new complaint
        status, _ = ComplaintStatus.objects.get_or_create(
            name="pending",
            defaults={"order": 1, "description": "Awaiting review"}
        )

        title = validated_data.get("title", "")
        desc = validated_data.get("description", "")
        cost = ComplaintService.calculate_estimated_cost(title, desc)

        complaint = Complaint.objects.create(
            user=user,
            status=status,
            estimated_cost=cost,
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