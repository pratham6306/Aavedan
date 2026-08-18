import os
import sys
import django
import random

sys.path.append(r"e:\Starting new\gov_complaint_schemes\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from complaints.models import Complaint, ComplaintStatus, DepartmentBudget, CivicProject
from departments.models import Department
from locations.models import District, State
from categories.models import ComplaintCategory
from accounts.models import User

def seed():
    print("=" * 60)
    print(" Seeding Rich District Analytics across ALL Districts ")
    print("=" * 60)

    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            username="admin_demo",
            email="admin@aavedansetu.gov.in",
            password="adminpassword123",
            full_name="System Admin",
            role="ADMIN"
        )

    states = State.objects.all()
    districts = District.objects.all()
    categories = ComplaintCategory.objects.all()
    departments = Department.objects.all()
    
    pending_status = ComplaintStatus.objects.filter(name__iexact="pending").first() or ComplaintStatus.objects.first()
    in_progress_status = ComplaintStatus.objects.filter(name__icontains="progress").first() or pending_status
    resolved_status = ComplaintStatus.objects.filter(name__iexact="resolved").first() or pending_status

    print(f"[+] Found {districts.count()} districts across {states.count()} states.")

    # 1. Seed DepartmentBudgets for all districts
    budget_count = 0
    for dist in districts:
        for dept in departments:
            obj, created = DepartmentBudget.objects.get_or_create(
                department=dept,
                district=dist,
                fiscal_year="2025-2026",
                defaults={
                    "state": dist.state,
                    "allocated_budget": random.choice([2500000.00, 4000000.00, 6000000.00, 8000000.00]),
                    "spent_budget": random.choice([350000.00, 850000.00, 1200000.00, 1800000.00]),
                }
            )
            if created:
                budget_count += 1

    print(f"[OK] Created {budget_count} new DepartmentBudget entries.")

    # 2. Seed Complaints & CivicProjects for all districts
    complaint_titles = [
        ("Pothole & Severe Road Surface Damage", "Road & Infrastructure", 150000.00),
        ("Transformer Sparking & High Voltage Hazards", "Electricity", 85000.00),
        ("Contaminated Water Supply & Pipe Leakage", "Water Supply", 60000.00),
        ("Overflowing Drainage & Sewerage Blockage", "Drainage & Sewerage", 75000.00),
        ("Uncleared Waste Dump & Garbage Accumulation", "Sanitation & Waste", 35000.00),
        ("Faulty Street Lights & Night Darkness", "Electricity", 45000.00),
    ]

    total_created_complaints = 0
    total_created_projects = 0

    for dist in districts:
        existing_comp_count = Complaint.objects.filter(district=dist).count()
        if existing_comp_count < 3:
            for idx, (title, cat_name, cost) in enumerate(complaint_titles):
                cat = categories.filter(name__icontains=cat_name.split()[0]).first() or categories.first()
                dept = departments.filter(name__icontains=cat_name.split()[0]).first() or departments.first()
                
                status_obj = resolved_status if idx % 3 == 0 else (in_progress_status if idx % 2 == 0 else pending_status)
                is_resolved = (status_obj == resolved_status)

                comp = Complaint.objects.create(
                    user=user,
                    title=f"{dist.name}: {title}",
                    description=f"Citizen reported {title.lower()} in {dist.name}, {dist.state.name}. Immediate resolution requested.",
                    address=f"Ward {random.randint(1, 20)}, Main Road, {dist.name}",
                    landmark=f"Near Government School / Primary Health Center",
                    state=dist.state,
                    district=dist,
                    category=cat,
                    department=dept,
                    status=status_obj,
                    priority=random.choice(["HIGH", "CRITICAL", "MEDIUM"]),
                    estimated_cost=cost,
                    is_verified_resolved=is_resolved
                )
                total_created_complaints += 1

        # 3. Create Grouped Civic Projects for each district
        dist_complaints = list(Complaint.objects.filter(district=dist))
        if len(dist_complaints) >= 3 and not CivicProject.objects.filter(district=dist).exists():
            for cat in categories[:2]:
                cat_comps = [c for c in dist_complaints if c.category == cat]
                if len(cat_comps) < 3:
                    cat_comps = dist_complaints[:3]

                proj_title = f"{dist.name} {cat.name} Civic Infrastructure Project"
                calc_cost = sum(float(c.estimated_cost) for c in cat_comps) or 450000.00
                proj_status = random.choice(["PROPOSED", "IN_EXECUTION", "COMPLETED"])

                proj = CivicProject.objects.create(
                    title=proj_title,
                    category=cat,
                    department=cat_comps[0].department if cat_comps else departments.first(),
                    state=dist.state,
                    district=dist,
                    ward_name=f"Ward {random.randint(1, 15)}",
                    estimated_cost=calc_cost,
                    allocated_budget=calc_cost + 100000.00,
                    status=proj_status
                )
                for c in cat_comps:
                    proj.complaints.add(c)
                total_created_projects += 1

    print(f"[OK] Created {total_created_complaints} complaints and {total_created_projects} civic projects.")
    print("=" * 60)
    print("Seeding Complete! Every district across India now has active analytics data.")
    print("=" * 60)

if __name__ == "__main__":
    seed()
