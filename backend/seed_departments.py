import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from departments.models import Department
from knowledge.data.departments import DEPARTMENTS

print("Seeding departments...")

for department in DEPARTMENTS:
    obj, created = Department.objects.get_or_create(
        name=department
    )

    if created:
        print(f"Created: {department}")
    else:
        print(f"Already exists: {department}")

print("Departments seeded successfully!")