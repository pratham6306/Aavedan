from django.db import models

from common.models import BaseModel
from categories.models import ComplaintCategory
from departments.models import Department
from complaints.choices import ComplaintPriority


class ComplaintType(BaseModel):
    category = models.ForeignKey(
        ComplaintCategory,
        on_delete=models.CASCADE,
        related_name="complaint_types",
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="complaint_types",
    )

    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    priority = models.CharField(
        max_length=10,
        choices=ComplaintPriority.choices,
        default=ComplaintPriority.MEDIUM,
    )

    slug = models.SlugField(
    unique=True,
    max_length=100,
    )

    estimated_resolution_days = models.PositiveIntegerField(
    default=7
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ComplaintKeyword(BaseModel):
    complaint_type = models.ForeignKey(
        ComplaintType,
        on_delete=models.CASCADE,
        related_name="keywords",
    )

    keyword = models.CharField(
        max_length=100,
    )

    weight = models.FloatField(
        default=1.0,
    )

    class Meta:
        unique_together = ("complaint_type", "keyword")
        ordering = ["keyword"]

    def __str__(self):
        return f"{self.keyword} ({self.complaint_type.name})"


class RequiredField(BaseModel):
    complaint_type = models.ForeignKey(
        ComplaintType,
        on_delete=models.CASCADE,
        related_name="required_fields",
    )

    field_name = models.CharField(
        max_length=100,
    )

    display_name = models.CharField(
        max_length=100,
    )

    is_required = models.BooleanField(
        default=True,
    )

    class Meta:
        unique_together = ("complaint_type", "field_name")
        ordering = ["field_name"]

    def __str__(self):
        return f"{self.complaint_type.name} - {self.display_name}"