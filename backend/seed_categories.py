import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from categories.models import ComplaintCategory
from knowledge.data.categories import CATEGORIES

print("Seeding categories...")

for category in CATEGORIES:
    obj, created = ComplaintCategory.objects.get_or_create(
        name=category
    )

    if created:
        print(f"Created: {category}")
    else:
        print(f"Already exists: {category}")

print("Categories seeded successfully!")