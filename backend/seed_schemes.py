import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from schemes.models import SchemeCategory, GovernmentScheme, RequiredDocument
from departments.models import Department
from locations.models import State

print("Seeding Scheme Categories, Departments, and Schemes...")

# 1. Categories
categories_data = ["Education", "Health", "Agriculture", "Housing", "Employment", "Finance", "Social Welfare"]
categories = {}
for cat_name in categories_data:
    cat, _ = SchemeCategory.objects.get_or_create(name=cat_name, defaults={"description": f"Schemes related to {cat_name}"})
    categories[cat_name] = cat
    print(f"Category ready: {cat_name}")

# 2. Departments
departments_data = [
    "Education", "Health & Family Welfare", "Agriculture & Farmers Welfare", 
    "Housing & Urban Affairs", "Labour & Employment", "Finance", "Social Justice & Empowerment"
]
departments = {}
for dept_name in departments_data:
    dept, _ = Department.objects.get_or_create(name=dept_name, defaults={"description": f"Department of {dept_name}"})
    departments[dept_name] = dept
    print(f"Department ready: {dept_name}")

# 3. States lookup
bihar = State.objects.get(name="Bihar")
odisha = State.objects.get(name="Odisha")
jharkhand = State.objects.get(name="Jharkhand")

# 4. Schemes Data
schemes_list = [
    {
        "category": categories["Housing"],
        "department": departments["Housing & Urban Affairs"],
        "state": odisha,
        "scheme_name": "Biju Pucca Ghar Yojana",
        "scheme_code": "BPGY-OD",
        "description": "An initiative by the Odisha state government to provide pucca houses to people living in kutcha houses in rural areas.",
        "benefits": "Financial assistance of up to Rs. 1.3 Lakhs for house construction, paid directly in installments.",
        "eligibility": "Must be a rural resident of Odisha currently living in a kutcha house and not having received assistance from other housing schemes.",
        "keywords": "housing, rural, pucca ghar, home, construction, shelter",
        "official_website": "https://rhodisha.gov.in/",
        "application_link": "https://rhodisha.gov.in/apply/",
        "helpline_number": "1800-344-3242",
        "documents": ["Aadhaar Card", "Ration Card", "Land Possession Certificate", "Income Certificate"]
    },
    {
        "category": categories["Education"],
        "department": departments["Education"],
        "state": bihar,
        "scheme_name": "Bihar Post Matric Scholarship",
        "scheme_code": "PMS-BR",
        "description": "Financial assistance for SC, ST, OBC, and EBC students of Bihar pursuing post-matric courses in recognized institutions.",
        "benefits": "Reimbursement of tuition fees, compulsory non-refundable fees, and maintenance allowance.",
        "eligibility": "Students belonging to SC, ST, OBC, or EBC categories in Bihar, with annual family income below Rs. 2.5 Lakhs.",
        "keywords": "scholarship, education, post matric, SC, ST, OBC, tuition, college",
        "official_website": "https://pmsonline.bih.nic.in/",
        "application_link": "https://pmsonline.bih.nic.in/register/",
        "helpline_number": "1800-345-6345",
        "documents": ["Aadhaar Card", "Caste Certificate", "Income Certificate", "Residence Certificate", "Fee Receipt", "Mark Sheet"]
    },
    {
        "category": categories["Agriculture"],
        "department": departments["Agriculture & Farmers Welfare"],
        "state": jharkhand,
        "scheme_name": "Jharkhand Rajya Fasal Rahat Yojana",
        "scheme_code": "JRFRY-JH",
        "description": "A crop relief scheme designed to provide financial security to farmers in Jharkhand in case of crop damage due to natural calamities.",
        "benefits": "Compensation of up to Rs. 20,000 per hectare for crop loss due to drought, floods, or other disasters.",
        "eligibility": "All land-owning and tenant farmers of Jharkhand whose crops have suffered damage.",
        "keywords": "farmer, agriculture, crop damage, relief, insurance, compensation, disaster",
        "official_website": "https://jrfry.jharkhand.gov.in/",
        "application_link": "https://jrfry.jharkhand.gov.in/login/",
        "helpline_number": "1800-123-5678",
        "documents": ["Land Records (Parcha)", "Bank Passbook", "Aadhaar Card", "Crop sowing self-declaration"]
    }
]

for s in schemes_list:
    scheme = GovernmentScheme.objects.filter(scheme_name=s["scheme_name"]).first()
    if not scheme:
        scheme = GovernmentScheme.objects.filter(scheme_code=s["scheme_code"]).first()
    
    if not scheme:
        scheme = GovernmentScheme.objects.create(
            scheme_code=s["scheme_code"],
            category=s["category"],
            department=s["department"],
            state=s["state"],
            scheme_name=s["scheme_name"],
            description=s["description"],
            benefits=s["benefits"],
            eligibility=s["eligibility"],
            keywords=s["keywords"],
            official_website=s["official_website"],
            application_link=s["application_link"],
            helpline_number=s["helpline_number"],
            is_active=True
        )
        print(f"Created Scheme: {s['scheme_name']}")
    else:
        print(f"Scheme already exists: {s['scheme_name']}")
        
    for doc in s["documents"]:
        RequiredDocument.objects.get_or_create(
            scheme=scheme,
            document_name=doc
        )
        print(f"  Added Document: {doc}")

print("Schemes seeded successfully!")
