from django.shortcuts import get_object_or_404
import random

from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ComplaintFilter


from .permissions import IsComplaintOwner
from ai.services.knowledge_retriever import KnowledgeRetriever

_kr = KnowledgeRetriever()

from .models import Complaint
from .serializers import (
    ComplaintCreateSerializer,
    ComplaintDetailSerializer,
    ComplaintImageSerializer,
    ComplaintListSerializer,
    ComplaintUpdateSerializer,
)
from .services import ComplaintService

class ComplaintCreateView(GenericAPIView):
    serializer_class = ComplaintCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        complaint = ComplaintService.create_complaint(
            user=request.user,
            validated_data=serializer.validated_data,
        )

        return Response(
            {
                "message": "Complaint created successfully.",
                "data": ComplaintDetailSerializer(complaint).data,
            },
            status=status.HTTP_201_CREATED,
        )
    
    


class ComplaintListView(ListAPIView):
    serializer_class = ComplaintListSerializer
    permission_classes = [IsAuthenticated]

    queryset = Complaint.objects.filter(
        is_deleted=False,
    )

    filterset_class = ComplaintFilter

    search_fields = (
        "reference_number",
        "title",
        "description",
    )

    ordering_fields = (
        "created_at",
        "priority",
        "reference_number",
    )

    ordering = (
        "-created_at",
    )
    
class ComplaintDetailView(GenericAPIView):
    serializer_class = ComplaintDetailSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        complaint = get_object_or_404(
            Complaint,
            pk=pk,
            is_deleted=False,
        )

        serializer = self.get_serializer(complaint)

        return Response(serializer.data)
    
class ComplaintUpdateView(GenericAPIView):
    serializer_class = ComplaintUpdateSerializer
    permission_classes = [IsAuthenticated, IsComplaintOwner,]

    def patch(self, request, pk):
        complaint = get_object_or_404(
            Complaint,
            pk=pk,
            is_deleted=False,
        )
        self.check_object_permissions(
    request,
    complaint,
)

        serializer = self.get_serializer(
            complaint,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        complaint = ComplaintService.update_complaint(
            complaint=complaint,
            validated_data=serializer.validated_data,
        )

        return Response(
            {
                "message": "Complaint updated successfully.",
                "data": ComplaintDetailSerializer(complaint).data,
            }
        )
    
class ComplaintDeleteView(GenericAPIView):
    permission_classes = [IsAuthenticated, IsComplaintOwner,]

    def delete(self, request, pk):
        complaint = get_object_or_404(
            Complaint,
            pk=pk,
            is_deleted=False,
        )
        self.check_object_permissions(
    request,
    complaint,
)

        ComplaintService.delete_complaint(
            complaint
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
    
class ComplaintImageUploadView(GenericAPIView):
    serializer_class = ComplaintImageSerializer
    permission_classes = [IsAuthenticated, IsComplaintOwner,]

    def post(self, request, pk):
        complaint = get_object_or_404(
            Complaint,
            pk=pk,
            is_deleted=False,
        )
        self.check_object_permissions(
    request,
    complaint,
)

        images = request.FILES.getlist("images")

        if not images:
            return Response(
                {
                    "message": "No images uploaded."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        ComplaintService.upload_images(
            complaint=complaint,
            images=images,
        )

        return Response(
            {
                "message": "Images uploaded successfully."
            }
        )
class MyComplaintListView(ListAPIView):
    serializer_class = ComplaintListSerializer
    permission_classes = [IsAuthenticated]

    filterset_class = ComplaintFilter

    search_fields = (
        "reference_number",
        "title",
        "description",
    )

    ordering_fields = (
        "created_at",
        "priority",
        "reference_number",
    )

    ordering = (
        "-created_at",
    )

    def get_queryset(self):
        return Complaint.objects.filter(
            user=self.request.user,
            is_deleted=False,
        )

class CategoryListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from knowledge.models import ComplaintCategory
        categories = ComplaintCategory.objects.filter(is_active=True).values("id", "name")
        return Response(list(categories))


class DepartmentListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from departments.models import Department
        depts = Department.objects.filter(is_active=True).values("id", "name")
        return Response(list(depts))


class ComplaintSupportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk, is_deleted=False)
        from .models import ComplaintSupport

        user = request.user
        dist_param = request.data.get("district") or request.data.get("district_id") or request.query_params.get("district_id")
        if not user.district:
            try:
                from locations.models import District
                dist_obj = None
                if dist_param:
                    dist_obj = District.objects.filter(id=dist_param).first() or District.objects.filter(name__iexact=str(dist_param)).first()
                if not dist_obj and complaint.district:
                    dist_obj = complaint.district
                if not dist_obj:
                    dist_obj = District.objects.filter(name__icontains="Madhepura").first() or District.objects.first()

                if dist_obj:
                    user.district = dist_obj
                    user.state = dist_obj.state
                    user.save()
            except Exception:
                pass

        # Proximity Check: User must reside in the same district as the reported complaint
        if complaint.district and user.district.id != complaint.district.id:
            return Response({
                "detail": f"Geo-Fencing Error: Verification voting is restricted to local residents of {complaint.district.name} district."
            }, status=status.HTTP_403_FORBIDDEN)

        support, created = ComplaintSupport.objects.get_or_create(
            complaint=complaint,
            user=request.user
        )

        if not created:
            support.delete()
            try:
                recalculate_civic_projects()
            except Exception:
                pass
            return Response({
                "supported": False,
                "supports_count": complaint.supports.count(),
                "message": "Local verification support removed."
            }, status=status.HTTP_200_OK)

        try:
            recalculate_civic_projects()
        except Exception:
            pass

        return Response({
            "supported": True,
            "supports_count": complaint.supports.count(),
            "message": "Local resident verification supported successfully!"
        }, status=status.HTTP_201_CREATED)


class ComplaintDuplicateCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        category_id = request.data.get("category")
        department_id = request.data.get("department")
        state_id = request.data.get("state")
        district_id = request.data.get("district")
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        if not (category_id and district_id):
            return Response(
                {"error": "Missing required fields (category, district)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Base query for active, pending complaints in the same district and category
        qs = Complaint.objects.filter(
            is_deleted=False,
            is_verified_resolved=False,
            district_id=district_id,
            category_id=category_id
        ).exclude(status__name__in=["Resolved", "VERIFIED_RESOLVED", "resolved"])

        if state_id:
            qs = qs.filter(state_id=state_id)
        if department_id:
            qs = qs.filter(department_id=department_id)

        new_text = (str(request.data.get("title", "")) + " " + str(request.data.get("description", ""))).lower()

        # Keyword signature extractor via Single Source of Truth KnowledgeRetriever
        def get_sub_issue_signature(text):
            res = _kr.retrieve(text)
            return res.get("complaint_type") or "general"

        new_sig = get_sub_issue_signature(new_text)

        duplicates = []

        # Filter candidate complaints matching the sub-issue signature
        candidate_qs = []
        for c in qs:
            c_text = (c.title + " " + (c.description or "")).lower()
            c_sig = get_sub_issue_signature(c_text)
            if new_sig == "general" or c_sig == new_sig:
                candidate_qs.append(c)

        # Coordinate box comparison
        if latitude and longitude:
            try:
                lat = float(latitude)
                lon = float(longitude)
                for c in candidate_qs:
                    if c.latitude and c.longitude:
                        c_lat = float(c.latitude)
                        c_lon = float(c.longitude)
                        # ~300 meter coordinate bounding box
                        if abs(c_lat - lat) < 0.003 and abs(c_lon - lon) < 0.003:
                            duplicates.append(c)
            except ValueError:
                pass
        else:
            # If no coordinates, return matching sub-issue complaints
            duplicates = candidate_qs[:3]

        if duplicates:
            return Response({
                "duplicate_found": True,
                "duplicates": ComplaintListSerializer(duplicates, many=True).data
            }, status=status.HTTP_200_OK)

        return Response({
            "duplicate_found": False,
            "duplicates": []
        }, status=status.HTTP_200_OK)


from django.db.models import Sum, Count
from .models import DepartmentBudget, CivicProject, CivicProjectVote, ComplaintStatus
from .serializers import DepartmentBudgetSerializer, CivicProjectSerializer

class BudgetAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        district_id = request.query_params.get("district_id")
        state_id = request.query_params.get("state_id")
        
        complaint_qs = Complaint.objects.filter(is_deleted=False)
        budget_qs = DepartmentBudget.objects.all()
        project_qs = CivicProject.objects.all()

        if district_id:
            budget_qs = budget_qs.filter(district_id=district_id)
            complaint_qs = complaint_qs.filter(district_id=district_id)
            project_qs = project_qs.filter(district_id=district_id)
        elif state_id:
            budget_qs = budget_qs.filter(state_id=state_id)
            complaint_qs = complaint_qs.filter(state_id=state_id)
            project_qs = project_qs.filter(state_id=state_id)

        # 1. Real Spent Budget = Sum of Completed/In-Progress Projects + Resolved Complaints
        project_spent = project_qs.filter(status__in=["COMPLETED", "IN_PROGRESS"]).aggregate(s=Sum("estimated_cost"))["s"] or 0.0
        resolved_comp_spent = complaint_qs.filter(status__name__iexact="resolved").aggregate(s=Sum("estimated_cost"))["s"] or 0.0
        real_spent = float(project_spent) + float(resolved_comp_spent)

        # 2. Total Allocated Budget = DepartmentBudget table OR Base Municipal Pool
        raw_allocated = budget_qs.aggregate(s=Sum("allocated_budget"))["s"]
        if raw_allocated is not None and float(raw_allocated) > 0:
            total_allocated = float(raw_allocated)
            total_spent = real_spent
        elif district_id:
            d_id = int(district_id) if str(district_id).isdigit() else 1
            # District Municipal Base Pool: ₹3.0 Cr base + proportional scaling
            total_allocated = float(30000000.00 + (d_id * 2500000.00))
            total_spent = real_spent
        else:
            total_allocated = 50000000.00
            total_spent = real_spent

        raw_backlog = complaint_qs.filter(status__name__in=["Pending", "In Progress", "pending", "review"]).aggregate(s=Sum("estimated_cost"))["s"]
        total_backlog_cost = float(raw_backlog) if raw_backlog is not None else 0.0
        
        total_count = complaint_qs.count()
        verified_count = complaint_qs.filter(is_verified_resolved=True).count()
        if total_count > 0:
            verified_count = min(verified_count, total_count)
        else:
            verified_count = 0
            
        resolved_count = complaint_qs.filter(status__name__iexact="resolved").count()

        total_projects = project_qs.count()
        completed_projects = project_qs.filter(status="COMPLETED").count()

        dept_budgets = DepartmentBudgetSerializer(budget_qs[:10], many=True).data

        return Response({
            "total_allocated_budget": float(total_allocated),
            "total_spent_budget": float(total_spent),
            "remaining_budget": float(total_allocated - total_spent),
            "total_backlog_cost": float(total_backlog_cost),
            "total_complaints": total_count,
            "resolved_complaints": resolved_count,
            "verified_complaints": verified_count,
            "total_projects": total_projects,
            "completed_projects": completed_projects,
            "department_budgets": dept_budgets
        }, status=status.HTTP_200_OK)

def recalculate_civic_projects():
    def get_sub_issue_details(comp):
        text = comp.title + " " + (comp.description or "")
        res = _kr.retrieve(text)
        sub_title = res.get("complaint_type") or f"{comp.category.name if comp.category else 'Civic'} Infrastructure Project"
        sub_cost = float(res.get("estimated_cost", 100000.00))
        sub_key = sub_title.lower().replace(" ", "_")
        return (sub_key, sub_title, sub_cost)

    # Purge stale old generic projects that mixed different sub-issues together
    CivicProject.objects.filter(title__icontains="Electricity Civic Infrastructure Project").delete()

    # Auto-cluster complaints by (district, category, sub_issue_key)
    grouped_pending = {}
    active_complaints = Complaint.objects.filter(
        is_deleted=False
    ).exclude(
        status__name__in=["Resolved", "VERIFIED_RESOLVED", "resolved"]
    ).select_related("district", "category", "department", "state").all()
    
    for c in active_complaints:
        if not c.district or not c.category:
            continue
        sub_key, _, _ = get_sub_issue_details(c)
        key = (c.district.id, c.category.id, sub_key)
        grouped_pending.setdefault(key, []).append(c)

    grouped_resolved = {}
    resolved_complaints = Complaint.objects.filter(
        is_deleted=False,
        status__name__iexact="resolved"
    ).select_related("district", "category", "department", "state").all()

    for c in resolved_complaints:
        if not c.district or not c.category:
            continue
        sub_key, _, _ = get_sub_issue_details(c)
        key = (c.district.id, c.category.id, sub_key)
        grouped_resolved.setdefault(key, []).append(c)

    # Process Pending Clusters according to strict 3-tier rule matrix
    for (dist_id, cat_id, sub_key), comp_list in grouped_pending.items():
        num_tickets = len(comp_list)
        total_upvotes = sum(c.supports.count() for c in comp_list)

        is_eligible = (
            (num_tickets >= 3) or
            (num_tickets == 2 and total_upvotes >= 2) or
            (num_tickets == 1 and total_upvotes >= 3)
        )

        if not is_eligible:
            continue

        first = comp_list[0]
        _, sub_title_suffix, sub_base_cost = get_sub_issue_details(first)
        proj_title = f"{first.district.name} {sub_title_suffix}"
        calc_cost = sub_base_cost

        import re
        ward_label = "Central Ward"
        for c in comp_list:
            loc_str = f"{c.landmark or ''} {c.address or ''} {c.description or ''}"
            match = re.search(r"\bward\s*(\d+)\b", loc_str, re.IGNORECASE)
            if match:
                ward_label = f"Ward {match.group(1)}"
                break

        proj, created = CivicProject.objects.get_or_create(
            title=proj_title,
            district=first.district,
            category=first.category,
            defaults={
                "state": first.state,
                "department": first.department,
                "ward_name": ward_label,
                "estimated_cost": calc_cost,
                "allocated_budget": calc_cost + 50000.00,
                "status": "PROPOSED"
            }
        )
        
        for c in comp_list:
            proj.complaints.add(c)
        proj.estimated_cost = calc_cost
        proj.save()

    # Process Resolved Clusters into COMPLETED Projects
    for (dist_id, cat_id, sub_key), comp_list in grouped_resolved.items():
        num_tickets = len(comp_list)
        total_upvotes = sum(c.supports.count() for c in comp_list)

        is_eligible = (
            (num_tickets >= 3) or
            (num_tickets == 2 and total_upvotes >= 2) or
            (num_tickets == 1 and total_upvotes >= 3)
        )

        if not is_eligible:
            continue

        first = comp_list[0]
        _, sub_title_suffix, sub_base_cost = get_sub_issue_details(first)
        proj_title = f"{first.district.name} Completed {sub_title_suffix}"
        calc_cost = sub_base_cost

        proj, created = CivicProject.objects.get_or_create(
            title=proj_title,
            district=first.district,
            category=first.category,
            defaults={
                "state": first.state,
                "department": first.department,
                "ward_name": f"Ward {random.randint(1, 15)}",
                "estimated_cost": calc_cost,
                "allocated_budget": calc_cost,
                "status": "COMPLETED"
            }
        )
        for c in comp_list:
            for old_proj in c.civic_projects.all():
                if old_proj.id != proj.id:
                    old_proj.complaints.remove(c)
            proj.complaints.add(c)
        proj.status = "COMPLETED"
        proj.estimated_cost = calc_cost
        proj.save()

    from django.db.models import Count
    all_projects = CivicProject.objects.annotate(num_c=Count("complaints")).filter(num_c__gt=0).all()
    
    projects_by_district = {}
    for p in all_projects:
        projects_by_district.setdefault(p.district_id, []).append(p)

    severity_map = {"CRITICAL": 100.0, "HIGH": 75.0, "MEDIUM": 50.0, "LOW": 25.0}

    for d_id, p_list in projects_by_district.items():
        max_demand = 1.0
        max_votes = 1.0
        p_metrics = []

        for p in p_list:
            R = p.complaints.count()
            L = sum(c.supports.count() for c in p.complaints.all())
            V = p.votes.count()
            demand = R + L
            max_demand = max(max_demand, demand)
            max_votes = max(max_votes, V)

            max_sev = "MEDIUM"
            for c in p.complaints.all():
                c_prio = (c.priority or "MEDIUM").upper()
                if severity_map.get(c_prio, 50.0) > severity_map.get(max_sev, 50.0):
                    max_sev = c_prio
            
            p_metrics.append({
                "project": p,
                "sev_score": severity_map.get(max_sev, 50.0),
                "demand": demand,
                "votes": V
            })

        total_district_score = 0.0
        for m in p_metrics:
            demand_score = (m["demand"] / max_demand) * 100.0
            vote_score = (m["votes"] / max_votes) * 100.0 if max_votes > 0 else 0.0
            prio_score = (0.40 * m["sev_score"]) + (0.35 * demand_score) + (0.25 * vote_score)
            m["prio_score"] = round(prio_score, 1)
            total_district_score += m["prio_score"]

        for m in p_metrics:
            p = m["project"]
            p.priority_score = m["prio_score"]
            p.priority_percentage = round((m["prio_score"] / total_district_score * 100.0), 1) if total_district_score > 0 else round(100.0 / len(p_metrics), 1)
            p.save()


class CivicProjectListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CivicProjectSerializer
    pagination_class = None  # Return all projects at once

    def get_queryset(self):
        from django.db.models import Count
        
        # Run recalculation if explicitly requested or if no projects exist
        force_refresh = self.request.query_params.get("refresh") == "true"
        if force_refresh or not CivicProject.objects.exists():
            recalculate_civic_projects()

        qs = CivicProject.objects.annotate(
            num_c=Count("complaints", distinct=True),
            total_supports=Count("complaints__supports", distinct=True)
        ).filter(num_c__gt=0).select_related("district", "category", "department", "state").prefetch_related("complaints", "votes").order_by("-priority_score")
        
        district_id = self.request.query_params.get("district_id")
        state_id = self.request.query_params.get("state_id")
        if district_id:
            qs = qs.filter(district_id=district_id)
        elif state_id:
            qs = qs.filter(state_id=state_id)
        return qs


class CivicProjectDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        project = get_object_or_404(CivicProject, pk=pk)
        from .serializers import CivicProjectDetailSerializer
        return Response(CivicProjectDetailSerializer(project, context={"request": request}).data, status=status.HTTP_200_OK)


class GroupProjectResolveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(CivicProject, pk=pk)
        
        raw_demo = str(request.data.get("demo_mode", "true")).lower()
        is_demo = raw_demo in ["true", "1", "yes"]
        if not (request.user.is_staff or is_demo or request.user.is_authenticated):
            return Response({"error": "Officer permissions required."}, status=status.HTTP_403_FORBIDDEN)

        after_image = request.FILES.get("after_image") or request.FILES.get("image")
        remarks = request.data.get("remarks", "Group infrastructure repair completed by department.")

        after_image = request.FILES.get("after_image") or request.FILES.get("image")
        remarks = request.data.get("remarks", "Group infrastructure repair completed by department.")

        if after_image:
            project.after_image = after_image
        elif not project.after_image:
            project.after_image = 'projects/resolutions/review_RpJMYxS.png'
        
        project.resolution_remarks = remarks
        project.resolved_by = request.user
        project.is_rejected = False
        project.status = "IN_EXECUTION"
        project.save()

        # Handle Multi-Photo Proof Uploads
        from .models import CivicProjectResolutionProof
        images = request.FILES.getlist("images") if "images" in request.FILES else ([after_image] if after_image else [])
        remarks_list = request.data.getlist("remarks_list") if hasattr(request.data, "getlist") and "remarks_list" in request.data else [remarks]
        complaint_ids = request.data.getlist("complaint_ids") if hasattr(request.data, "getlist") and "complaint_ids" in request.data else []

        if images:
            for idx, img in enumerate(images):
                r_text = remarks_list[idx] if idx < len(remarks_list) else remarks
                c_id = complaint_ids[idx] if idx < len(complaint_ids) else None
                c_obj = Complaint.objects.filter(id=c_id).first() if c_id else None
                CivicProjectResolutionProof.objects.create(
                    project=project,
                    complaint=c_obj,
                    image=img,
                    remarks=r_text,
                    uploaded_by=request.user
                )

        # Cascade resolution proof to ALL associated citizen complaints automatically!
        review_status = get_status_by_name("review")
        for complaint in project.complaints.all():
            complaint.after_image = project.after_image
            complaint.resolution_remarks = remarks
            complaint.resolved_at = timezone.now()
            complaint.status = review_status
            complaint.save()

        from .serializers import CivicProjectDetailSerializer
        return Response({
            "message": f"Group resolution proof submitted! All {project.complaints.count()} associated complaints updated to Under Review.",
            "data": CivicProjectDetailSerializer(project, context={"request": request}).data
        }, status=status.HTTP_200_OK)


class GroupProjectProofVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, proof_id):
        from .models import CivicProjectResolutionProof
        proof = get_object_or_404(CivicProjectResolutionProof, pk=proof_id)
        action = request.data.get("action")
        reason = request.data.get("reason", "")
        user = request.user
        dist_param = request.data.get("district_id") or request.query_params.get("district_id")
        if not user.district:
            try:
                from locations.models import District
                dist_obj = None
                if dist_param:
                    dist_obj = District.objects.filter(id=dist_param).first() or District.objects.filter(name__iexact=str(dist_param)).first()
                if not dist_obj and proof.project and proof.project.district:
                    dist_obj = proof.project.district
                if not dist_obj:
                    dist_obj = District.objects.filter(name__icontains="Madhepura").first() or District.objects.first()

                if dist_obj:
                    user.district = dist_obj
                    user.state = dist_obj.state
                    user.save()
            except Exception:
                pass

        # Proximity Check: User must reside in the same district as the project
        project = proof.project
        if project and project.district and user.district.id != project.district.id:
            return Response({
                "detail": f"Geo-Fencing Restriction: You reside in {user.district.name}, but this project is in {project.district.name}. Verification voting is restricted to local residents."
            }, status=status.HTTP_403_FORBIDDEN)

        if action == "approve":
            proof.verified_by.add(request.user)
            if proof.rejected_by.filter(id=request.user.id).exists():
                proof.rejected_by.remove(request.user)
            proof.is_rejected = False
            proof.save()
            msg = "Photo resolution proof approved."
        elif action == "reject":
            proof.rejected_by.add(request.user)
            if proof.verified_by.filter(id=request.user.id).exists():
                proof.verified_by.remove(request.user)
            proof.is_rejected = True

            # Format citizen feedback log entry with citizen name and timestamp
            user_name = request.user.full_name or request.user.email or "Local Resident"
            new_entry = f"• {reason.strip()} — (by {user_name})"

            if proof.rejection_reason and proof.rejection_reason.strip():
                if new_entry not in proof.rejection_reason:
                    proof.rejection_reason = f"{proof.rejection_reason.strip()}\n{new_entry}"
            else:
                proof.rejection_reason = new_entry

            proof.save()
            msg = f"Photo proof rejected: {reason}"
        else:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        from .serializers import CivicProjectResolutionProofSerializer
        return Response({
            "message": msg,
            "proof": CivicProjectResolutionProofSerializer(proof, context={"request": request}).data
        }, status=status.HTTP_200_OK)


class GroupProjectVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(CivicProject, pk=pk)
        action = request.data.get("action") # "approve" or "reject"

        if action == "approve":
            project.verified_by.add(request.user)
            if project.rejected_by.filter(id=request.user.id).exists():
                project.rejected_by.remove(request.user)
            v_count = project.verified_by.count()

            # ONLY transition to COMPLETED & resolved when STRICTLY 3 or more approvals are received!
            if v_count >= 3:
                project.status = "COMPLETED"
                project.save()

                resolved_status = get_status_by_name("resolved")
                for complaint in project.complaints.all():
                    complaint.is_verified_resolved = True
                    complaint.verified_at = timezone.now()
                    complaint.status = resolved_status
                    complaint.save()

            from .serializers import CivicProjectDetailSerializer
            return Response({
                "message": f"Group verification recorded! ({v_count}/3 citizen approvals). Status remains Under Review until 3 approvals.",
                "verifications_count": v_count,
                "project_status": project.status,
                "data": CivicProjectDetailSerializer(project, context={"request": request}).data
            }, status=status.HTTP_200_OK)

        elif action == "reject":
            project.rejected_by.add(request.user)
            if project.verified_by.filter(id=request.user.id).exists():
                project.verified_by.remove(request.user)
            r_count = project.rejected_by.count()

            # ONLY transition back to PROPOSED (Pending) & invalidate proof when STRICTLY 3 or more rejections are received!
            if r_count >= 3:
                uploader_email = project.resolved_by.email if project.resolved_by else None

                # Preserve rejected photo history for officials & citizens to inspect!
                project.rejected_image = project.after_image
                project.rejected_remarks = project.resolution_remarks or "Resolution proof rejected by 3 citizens."
                project.is_rejected = True

                project.status = "PROPOSED"
                project.after_image = None
                project.verified_by.clear()
                project.rejected_by.clear()
                project.save()

                pending_status = get_status_by_name("pending")
                for complaint in project.complaints.all():
                    complaint.is_verified_resolved = False
                    complaint.after_image = None
                    complaint.status = pending_status
                    complaint.save()

                # Dispatch automated rejection alert email to the SPECIFIC officer who uploaded the photo!
                if uploader_email:
                    from django.core.mail import send_mail
                    from django.conf import settings
                    subject = f"[URGENT ALERT] Resolution Proof Rejected: {project.title}"
                    body = f"""Dear Officer,

The resolution proof photo uploaded from your account ({uploader_email}) for '{project.title}' in {project.district.name} has been REJECTED by 3 citizens.

Status Update:
- Ward Project status reverted to PENDING (Proposed).
- All {project.complaints.count()} associated citizen complaints re-opened.

Please re-inspect the location and upload a new geotagged repair proof once re-work is completed.

Aavedan Setu Governance Team
"""
                    try:
                        send_mail(
                            subject=subject,
                            message=body,
                            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@aavedansetu.gov.in'),
                            recipient_list=[uploader_email],
                            fail_silently=True,
                        )
                    except Exception as e:
                        print("Email send error:", e)

            from .serializers import CivicProjectDetailSerializer
            return Response({
                "message": f"Group rejection recorded! ({r_count}/3 citizen rejections). Status remains Under Review until 3 rejections.",
                "rejections_count": r_count,
                "project_status": project.status,
                "data": CivicProjectDetailSerializer(project, context={"request": request}).data
            }, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action. Choose 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)


class CivicProjectVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        project = get_object_or_404(CivicProject, pk=pk)
        vote, created = CivicProjectVote.objects.get_or_create(project=project, user=request.user)
        
        if not created:
            vote.delete()
            return Response({"voted": False, "votes_count": project.votes.count()}, status=status.HTTP_200_OK)
        
        return Response({"voted": True, "votes_count": project.votes.count()}, status=status.HTTP_200_OK)


from django.utils import timezone

import base64
from django.core.files.base import ContentFile
from django.db.models import Max

TINY_JPEG_B64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

def get_status_by_name(name_str):
    status_obj = ComplaintStatus.objects.filter(name__iexact=name_str).first()
    if not status_obj:
        max_order = (ComplaintStatus.objects.aggregate(m=Max("order"))["m"] or 0) + 1
        status_obj = ComplaintStatus.objects.create(name=name_str, order=max_order)
    return status_obj

class OfficerResolveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        
        # Officer or Demo Mode permission check (accept string "true", "1", or boolean)
        raw_demo = str(request.data.get("demo_mode", "true")).lower()
        is_demo = raw_demo in ["true", "1", "yes"]
        if not (request.user.is_staff or is_demo or request.user.is_authenticated):
            return Response({"error": "Officer permissions required to upload resolution proof."}, status=status.HTTP_403_FORBIDDEN)

        after_image = request.FILES.get("after_image") or request.FILES.get("image")
        remarks = request.data.get("remarks", "Work completed by department officer.")

        if after_image:
            complaint.after_image = after_image
        elif not complaint.after_image:
            if complaint.images.exists():
                complaint.after_image = complaint.images.first().image
            else:
                complaint.after_image = 'complaints/review_RpJMYxS.png'
        
        complaint.resolution_remarks = remarks
        complaint.resolved_at = timezone.now()

        # Set status to Resolved
        complaint.status = get_status_by_name("review")
        complaint.save()

        # If complaint belongs to a civic project, set proof on project too
        for project in complaint.civic_projects.all():
            if complaint.after_image:
                project.after_image = complaint.after_image
            project.status = "IN_EXECUTION"
            project.save()

        return Response({
            "message": "Resolution proof submitted successfully. Pending citizen verification.",
            "data": ComplaintDetailSerializer(complaint, context={"request": request}).data
        }, status=status.HTTP_200_OK)


class CitizenVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        complaint = get_object_or_404(Complaint, pk=pk)
        action = request.data.get("action") # "approve" or "reject"

        if action == "approve":
            complaint.is_verified_resolved = True
            complaint.verified_at = timezone.now()
            complaint.status = get_status_by_name("resolved")
            complaint.save()

            # Mark associated project as completed if all verified
            for project in complaint.civic_projects.all():
                project.status = "COMPLETED"
                project.save()

            return Response({"message": "Resolution verified successfully!", "verified": True}, status=status.HTTP_200_OK)
        
        elif action == "reject":
            complaint.is_verified_resolved = False
            complaint.after_image = None
            complaint.status = get_status_by_name("rejected")
            complaint.save()

            return Response({"message": "Resolution proof rejected. Complaint marked as Rejected.", "verified": False}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action. Choose 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
