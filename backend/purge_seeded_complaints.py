import os
import sys
import django

sys.path.append(r"e:\Starting new\gov_complaint_schemes\backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from complaints.models import Complaint, CivicProject, CivicProjectResolutionProof, CivicProjectVote

def purge():
    print("=" * 60)
    print(" Purging All Seeded Complaints & Civic Projects ")
    print("=" * 60)

    # 1. Delete all proof photos and votes
    proof_count = CivicProjectResolutionProof.objects.count()
    CivicProjectResolutionProof.objects.all().delete()
    
    vote_count = CivicProjectVote.objects.count()
    CivicProjectVote.objects.all().delete()

    # 2. Delete all civic projects
    project_count = CivicProject.objects.count()
    CivicProject.objects.all().delete()

    # 3. Delete seeded complaints
    seeded_complaints = Complaint.objects.filter(description__icontains="Citizen reported")
    comp_count = seeded_complaints.count()
    seeded_complaints.delete()

    print(f"[OK] Deleted {proof_count} Resolution Proofs.")
    print(f"[OK] Deleted {vote_count} Project Votes.")
    print(f"[OK] Deleted {project_count} Civic Projects.")
    print(f"[OK] Deleted {comp_count} Seeded Complaints.")
    print("=" * 60)
    print("Purge Complete! Database is clean.")
    print("=" * 60)

if __name__ == "__main__":
    purge()
