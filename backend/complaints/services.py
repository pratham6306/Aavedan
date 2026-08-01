from .models import Complaint, ComplaintImage, ComplaintStatus

class ComplaintService:

    @staticmethod
    def create_complaint(*, user, validated_data):
        # Resolve initial status for the new complaint
        status, _ = ComplaintStatus.objects.get_or_create(
            name="pending",
            defaults={"order": 1, "description": "Awaiting review"}
        )

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