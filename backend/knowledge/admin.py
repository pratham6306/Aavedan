
# Register your models here.
from django.contrib import admin

from .models import (
    ComplaintType,
    ComplaintKeyword,
    RequiredField,
)


class ComplaintKeywordInline(admin.TabularInline):
    model = ComplaintKeyword
    extra = 1


class RequiredFieldInline(admin.TabularInline):
    model = RequiredField
    extra = 1


@admin.register(ComplaintType)
class ComplaintTypeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "department",
        "priority",
        "is_active",
    )

    list_filter = (
        "category",
        "department",
        "priority",
        "is_active",
    )

    search_fields = (
        "name",
        "description",
    )

    inlines = [
        ComplaintKeywordInline,
        RequiredFieldInline,
    ]


@admin.register(ComplaintKeyword)
class ComplaintKeywordAdmin(admin.ModelAdmin):
    list_display = (
        "keyword",
        "complaint_type",
        "weight",
    )

    search_fields = (
        "keyword",
    )


@admin.register(RequiredField)
class RequiredFieldAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "complaint_type",
        "is_required",
    )

    list_filter = (
        "is_required",
    )