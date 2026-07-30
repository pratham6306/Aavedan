import os
import django

from django.db import transaction

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from categories.models import ComplaintCategory
from departments.models import Department

from knowledge.models import (
    ComplaintType,
    ComplaintKeyword,
    RequiredField,
)

from knowledge.data.complaint_data import COMPLAINT_DATA


print("=" * 60)
print("Seeding Complaint Knowledge Base")
print("=" * 60)

created_count = 0
updated_count = 0
skipped_count = 0

with transaction.atomic():

    for data in COMPLAINT_DATA:

        try:
            category = ComplaintCategory.objects.get(
                name=data["category"]
            )

            department = Department.objects.get(
                name=data["department"]
            )

        except ComplaintCategory.DoesNotExist:
            print(f"❌ Category not found: {data['category']}")
            skipped_count += 1
            continue

        except Department.DoesNotExist:
            print(f"❌ Department not found: {data['department']}")
            skipped_count += 1
            continue

        complaint_type, created = ComplaintType.objects.update_or_create(
            slug=data["slug"],
            defaults={
                "category": category,
                "department": department,
                "name": data["name"],
                "description": data["description"],
                "priority": data["priority"],
                "estimated_resolution_days": data["estimated_resolution_days"],
                "is_active": True,
            },
        )

        if created:
            created_count += 1
            print(f"✅ Created: {complaint_type.name}")
        else:
            updated_count += 1
            print(f"🔄 Updated: {complaint_type.name}")

        # ---------------------------------------
        # Synchronize Keywords
        # ---------------------------------------

        complaint_type.keywords.all().delete()

        ComplaintKeyword.objects.bulk_create(
            [
                ComplaintKeyword(
                    complaint_type=complaint_type,
                    keyword=keyword.lower().strip(),
                    weight=1.0,
                )
                for keyword in data["keywords"]
            ]
        )

        # ---------------------------------------
        # Synchronize Required Fields
        # ---------------------------------------

        complaint_type.required_fields.all().delete()

        RequiredField.objects.bulk_create(
            [
                RequiredField(
                    complaint_type=complaint_type,
                    field_name=field["field_name"],
                    display_name=field["display_name"],
                    is_required=field["is_required"],
                )
                for field in data["required_fields"]
            ]
        )

print("\n" + "=" * 60)
print("Knowledge Base Seeding Completed")
print("=" * 60)

print(f"✅ Created : {created_count}")
print(f"🔄 Updated : {updated_count}")
print(f"⚠️ Skipped : {skipped_count}")

print("=" * 60)