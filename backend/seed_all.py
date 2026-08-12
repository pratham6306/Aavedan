import os
import django

# Setup django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

print("=" * 60)
print(" GovConnect: Unified Database Seeding ")
print("=" * 60)

# 1. Seed categories
print("Step 1: Seeding Categories...")
import seed_categories

# 2. Seed departments
print("\nStep 2: Seeding Departments...")
import seed_departments

# 3. Seed complaint types & knowledge base
print("\nStep 3: Seeding Complaint Knowledge Base...")
import seed_knowledge

# 4. Seed Indian states & districts
print("\nStep 4: Seeding Indian States & Districts...")
import seed_locations

# 5. Seed government welfare schemes
print("\nStep 5: Seeding Government Welfare Schemes...")
import seed_schemes

print("\n" + "=" * 60)
print("Unified Seeding Complete!")
print("=" * 60)
