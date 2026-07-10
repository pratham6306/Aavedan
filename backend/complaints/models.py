from xml.parsers.expat import errors

from django.db import models
from django.utils import timezone
from accounts.models import User
from categories.models import ComplaintCategory
from common.models import BaseModel
from departments.models import Department, DepartmentOffice
from locations.models import District, State
from django.core.exceptions import ValidationError
from .choices import ComplaintPriority


class ComplaintStatus(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    order = models.PositiveIntegerField(
        unique=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["order"]
        verbose_name = "Complaint Status"
        verbose_name_plural = "Complaint Statuses"

    def __str__(self):
        return self.name


class Complaint(BaseModel):
    reference_number = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="complaints",
    )

    category = models.ForeignKey(
        ComplaintCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints",
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints",
    )

    department_office = models.ForeignKey(
        DepartmentOffice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints",
    )

    state = models.ForeignKey(
        State,
        on_delete=models.PROTECT,
        related_name="complaints",
    )

    district = models.ForeignKey(
        District,
        on_delete=models.PROTECT,
        related_name="complaints",
    )

    status = models.ForeignKey(
        ComplaintStatus,
        on_delete=models.PROTECT,
        related_name="complaints",
    )

    priority = models.CharField(
        max_length=10,
        choices=ComplaintPriority.choices,
        default=ComplaintPriority.MEDIUM,
    )

    title = models.CharField(
        max_length=200,
    )

    description = models.TextField()

    address = models.TextField()

    landmark = models.CharField(
        max_length=200,
        blank=True,
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    ai_summary = models.TextField(
        blank=True,
    )

    ai_confidence = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
    )

    is_ai_processed = models.BooleanField(
        default=False,
    )

    is_anonymous = models.BooleanField(
        default=False,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Complaint"
        verbose_name_plural = "Complaints"

    def save(self, *args, **kwargs):
        if not self.reference_number:
            year = timezone.now().year

            last_complaint = (
                Complaint.objects
                .filter(reference_number__startswith=f"GC-{year}")
                .order_by("-id")
                .first()
            )

            if last_complaint:
                last_number = int(
                    last_complaint.reference_number.split("-")[-1]
                )
                new_number = last_number + 1
            else:
                new_number = 1

            self.reference_number = (
                f"GC-{year}-{new_number:06d}"
            )

        super().save(*args, **kwargs)
    
    def clean(self):
        errors = {}

    # Validate District belongs to State
        if self.district and self.state:
            if self.district.state != self.state:
                errors["district"] = (
                    "Selected district does not belong to the selected state."
                )

        # Validate Office belongs to Department
        if self.department and self.department_office:
            if self.department_office.department != self.department:
                errors["department_office"] = (
                    "Selected office does not belong to the selected department."
                )

     # Validate Office belongs to District
        if self.department_office and self.district:
            if self.department_office.district != self.district:
                errors["department_office"] = (
                    "Selected office does not belong to the selected district."
                )

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.reference_number} - {self.title}"


class ComplaintImage(BaseModel):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(
        upload_to="complaints/",
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Complaint Image"
        verbose_name_plural = "Complaint Images"

    def __str__(self):
        return self.complaint.reference_number


class ComplaintStatusHistory(BaseModel):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="status_history",
    )

    old_status = models.ForeignKey(
        ComplaintStatus,
        on_delete=models.PROTECT,
        related_name="old_status_history",
        null=True,
        blank=True,
    )

    new_status = models.ForeignKey(
        ComplaintStatus,
        on_delete=models.PROTECT,
        related_name="new_status_history",
    )

    remarks = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Complaint Status History"
        verbose_name_plural = "Complaint Status Histories"

    def __str__(self):
        return (
            f"{self.complaint.reference_number} → "
            f"{self.new_status.name}"
        )

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

@receiver(pre_save, sender=Complaint)
def cache_old_status(sender, instance, **kwargs):
    if instance.id:
        try:
            instance._old_status_id = Complaint.objects.get(id=instance.id).status_id
        except Complaint.DoesNotExist:
            instance._old_status_id = None
    else:
        instance._old_status_id = None

@receiver(post_save, sender=Complaint)
def create_complaint_notification(sender, instance, created, **kwargs):
    if created:
        from notifications.models import Notification
        from notifications.choices import NotificationType
        Notification.objects.create(
            user=instance.user,
            complaint=instance,
            title="Complaint Filed Successfully",
            message=f"Your complaint '{instance.title}' has been registered with reference number {instance.reference_number}.",
            notification_type=NotificationType.COMPLAINT_CREATED,
            action_url=f"/complaints/{instance.id}"
        )
    else:
        old_status_id = getattr(instance, "_old_status_id", None)
        if old_status_id and instance.status_id != old_status_id:
            from notifications.models import Notification
            from notifications.choices import NotificationType
            
            status_name = instance.status.name.lower()
            if status_name == "resolved":
                notif_type = NotificationType.COMPLAINT_RESOLVED
                title = "Complaint Resolved"
                msg = f"Good news! Your complaint '{instance.title}' (Ref: {instance.reference_number}) has been marked as resolved."
            elif status_name == "rejected":
                notif_type = NotificationType.COMPLAINT_UPDATED
                title = "Complaint Rejected"
                msg = f"Your complaint '{instance.title}' (Ref: {instance.reference_number}) has been rejected."
            else:
                notif_type = NotificationType.COMPLAINT_UPDATED
                title = "Complaint Status Updated"
                msg = f"The status of your complaint '{instance.title}' (Ref: {instance.reference_number}) has been updated to '{instance.status.name}'."

            Notification.objects.create(
                user=instance.user,
                complaint=instance,
                title=title,
                message=msg,
                notification_type=notif_type,
                action_url=f"/complaints/{instance.id}"
            )