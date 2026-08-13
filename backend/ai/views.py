from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
    SendEmailRequestSerializer,
    SendEmailResponseSerializer,
)
from .services.orchestrator import AIOrchestrator
from .services.email_dispatcher import EmailDispatcher
from .services.memory import MemoryManager
from .services.office_finder import OfficeFinder
from rest_framework.permissions import IsAuthenticated

# Models for database sync
from complaints.models import Complaint, ComplaintStatus
from locations.models import State, District
from departments.models import Department, DepartmentOffice
from categories.models import ComplaintCategory


class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = str(serializer.validated_data["session_id"])
        
        # If preloaded entities are passed, inject them directly into session memory
        preloaded_entities = serializer.validated_data.get("entities")
        if preloaded_entities:
            memory = MemoryManager()
            
            # Extract root level keys
            description = preloaded_entities.pop("description", None)
            category = preloaded_entities.pop("category", None)
            complaint_type = preloaded_entities.pop("complaint_type", None)
            department = preloaded_entities.pop("department", None)
            complaint_id = preloaded_entities.pop("complaint_id", None)
            
            # Map clean entities
            memory.update_session(
                session_id,
                entities=preloaded_entities,
                description=description,
                category=category,
                complaint_type=complaint_type,
                department=department,
                complaint_id=complaint_id
            )

        orchestrator = AIOrchestrator()

        result = orchestrator.process(
            message=serializer.validated_data["message"],
            session_id=session_id,
            image_base64=serializer.validated_data.get("image_base64"),
        )

        response_serializer = ChatResponseSerializer(result)

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class SendGrievanceEmailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendEmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = str(serializer.validated_data["session_id"])
        memory = MemoryManager()
        session_data = memory.get_session(session_id)

        complaint_type = session_data.get("complaint_type")
        department = session_data.get("department")
        category = session_data.get("category")
        priority = session_data.get("priority", "medium")
        entities = session_data.get("entities", {})
        state = session_data.get("state") or entities.get("state")
        district = session_data.get("district") or entities.get("district")

        # Fallback chain for missing department
        if not department:
            if category:
                from knowledge.models import ComplaintType
                ct = ComplaintType.objects.filter(category__name__iexact=category).first()
                if not ct:
                    ct = ComplaintType.objects.filter(category__name__icontains=category).first()
                if ct and ct.department:
                    department = ct.department.name
            
            # If still missing, check if we can match by complaint_type title keywords (e.g. "road" -> PWD)
            if not department and complaint_type:
                from knowledge.models import ComplaintType
                ct = ComplaintType.objects.filter(name__icontains=complaint_type).first()
                if ct and ct.department:
                    department = ct.department.name
                    
            # If still missing, fallback to the first department in the DB
            if not department:
                dept_obj = Department.objects.first()
                if dept_obj:
                    department = dept_obj.name
                else:
                    department = "General Administration Department"
            
            # Save the resolved department back to session state so it propagates to emails and summaries
            memory.update_session(session_id, department=department)

        if not complaint_type or not department or not state or not district:
            return Response(
                {
                    "success": False,
                    "message": "Incomplete complaint details. State, District, and Complaint Type must be resolved before sending."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve office details for confirmation message
        office_finder = OfficeFinder()
        office_info = office_finder.find_office(
            department_name=department,
            district_name=district,
            state_name=state
        )
        office_name = office_info.get("name", "Local Division Office")
        office_email = office_info.get("email", "Not available")

        # Send Email
        user_email = request.user.email
        is_anonymous = serializer.validated_data.get("is_anonymous", False)
        dispatcher = EmailDispatcher()
        try:
            dispatcher.send_grievance_email(session_data, user_email, is_anonymous=is_anonymous)
            
            # Automatically register the grievance in the central database
            try:
                # 1. Resolve State & District with robust fallbacks
                state_obj = State.objects.filter(name__iexact=state).first()
                if not state_obj:
                    # Fallback to the first state available in the seeded DB
                    state_obj = State.objects.first()
                
                district_obj = None
                if state_obj:
                    district_obj = District.objects.filter(name__iexact=district, state=state_obj).first()
                    if not district_obj:
                        district_obj = District.objects.filter(state=state_obj).first()
                if not district_obj:
                    district_obj = District.objects.first()
                
                # 2. Resolve Department with robust fallback
                dept_obj = Department.objects.filter(name__iexact=department).first()
                if not dept_obj and department:
                    # Look up by partial/contains match
                    dept_obj = Department.objects.filter(name__icontains=department).first()
                
                # 3. Resolve Category (fallback to default)
                cat_obj = None
                if category:
                    cat_obj = ComplaintCategory.objects.filter(name__iexact=category).first()
                    if not cat_obj:
                        cat_obj = ComplaintCategory.objects.filter(name__icontains=category).first()
                
                # 4. Resolve Status
                status_obj, _ = ComplaintStatus.objects.get_or_create(
                    name="pending",
                    defaults={"order": 1, "description": "Awaiting review"}
                )
                
                # 5. Resolve Office
                office_obj = None
                if dept_obj and district_obj and state_obj:
                    office_obj = DepartmentOffice.objects.filter(
                        department=dept_obj,
                        district=district_obj,
                        state=state_obj,
                        is_active=True
                    ).first()

                # 6. Create or Update the Complaint record to prevent duplicate creations
                complaint_id = session_data.get("complaint_id")
                if complaint_id:
                    try:
                        complaint_obj = Complaint.objects.get(id=complaint_id)
                        complaint_obj.title = f"AI Grievance: {complaint_type}"
                        complaint_obj.description = session_data.get("description") or complaint_obj.description
                        complaint_obj.address = entities.get("address") or "Not provided"
                        complaint_obj.landmark = entities.get("landmark") or ""
                        complaint_obj.state = state_obj
                        complaint_obj.district = district_obj
                        complaint_obj.department = dept_obj
                        complaint_obj.category = cat_obj
                        complaint_obj.department_office = office_obj
                        complaint_obj.status = status_obj
                        complaint_obj.priority = priority
                        complaint_obj.is_anonymous = is_anonymous
                        complaint_obj.save()
                    except Complaint.DoesNotExist:
                        Complaint.objects.create(
                            user=request.user,
                            title=f"AI Grievance: {complaint_type}",
                            description=session_data.get("description") or f"Grievance filed regarding {complaint_type}.",
                            address=entities.get("address") or "Not provided",
                            landmark=entities.get("landmark") or "",
                            state=state_obj,
                            district=district_obj,
                            department=dept_obj,
                            category=cat_obj,
                            department_office=office_obj,
                            status=status_obj,
                            priority=priority,
                            is_anonymous=is_anonymous,
                        )
                else:
                    Complaint.objects.create(
                        user=request.user,
                        title=f"AI Grievance: {complaint_type}",
                        description=session_data.get("description") or f"Grievance filed regarding {complaint_type}.",
                        address=entities.get("address") or "Not provided",
                        landmark=entities.get("landmark") or "",
                        state=state_obj,
                        district=district_obj,
                        department=dept_obj,
                        category=cat_obj,
                        department_office=office_obj,
                        status=status_obj,
                        priority=priority,
                        is_anonymous=is_anonymous,
                    )
            except Exception as db_err:
                # Print warning and traceback but don't fail the response if DB save fails
                import traceback
                print(f"Warning: Failed to sync AI complaint to database: {str(db_err)}")
                traceback.print_exc()

            # Clear session memory upon successful dispatch
            memory.clear_session(session_id)

            response_data = {
                "success": True,
                "message": f"Grievance email dispatched successfully to {office_name} ({office_email})."
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            err_msg = str(e)
            if "10061" in err_msg or "connection refused" in err_msg.lower() or "socket" in err_msg.lower():
                return Response(
                    {
                        "success": False,
                        "error_type": "SMTP_CONNECTION_REFUSED",
                        "message": f"Mail server connection refused ([WinError 10061]). Please configure the SMTP settings (EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER) in your Django backend 'settings.py' file to enable active email dispatching. In the meantime, you can copy the grievance text from the preview modal to send it manually."
                    },
                    status=status.HTTP_502_BAD_GATEWAY
                )
            return Response(
                {
                    "success": False,
                    "message": f"Failed to send email: {err_msg}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GrievanceEmailPreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendEmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = str(serializer.validated_data["session_id"])
        memory = MemoryManager()
        session_data = memory.get_session(session_id)

        complaint_type = session_data.get("complaint_type")
        department = session_data.get("department")
        entities = session_data.get("entities", {})
        state = session_data.get("state") or entities.get("state")
        district = session_data.get("district") or entities.get("district")

        # Fallback chain for missing department
        if not department:
            # Try to resolve category from session first if missing
            category = session_data.get("category")
            if category:
                from knowledge.models import ComplaintType
                ct = ComplaintType.objects.filter(category__name__iexact=category).first()
                if not ct:
                    ct = ComplaintType.objects.filter(category__name__icontains=category).first()
                if ct and ct.department:
                    department = ct.department.name
            
            # If still missing, check if we can match by complaint_type title keywords (e.g. "road" -> PWD)
            if not department and complaint_type:
                from knowledge.models import ComplaintType
                ct = ComplaintType.objects.filter(name__icontains=complaint_type).first()
                if ct and ct.department:
                    department = ct.department.name
                    
            # If still missing, fallback to the first department in the DB
            if not department:
                dept_obj = Department.objects.first()
                if dept_obj:
                    department = dept_obj.name
                else:
                    department = "General Administration Department"
            
            # Save the resolved department back to session state so it propagates to emails and summaries
            memory.update_session(session_id, department=department)

        # Allow email preview even if location is not fully resolved, enabling AI handoff forms to prefill.

        user_email = request.user.email
        is_anonymous = serializer.validated_data.get("is_anonymous", False)
        dispatcher = EmailDispatcher()
        try:
            preview_data = dispatcher.get_email_preview(session_data, user_email, is_anonymous=is_anonymous)
            preview_data["success"] = True

            # Perform backend duplicate checking
            state_obj = State.objects.filter(name__iexact=state).first()
            district_obj = None
            if state_obj:
                district_obj = District.objects.filter(name__iexact=district, state=state_obj).first()
            dept_obj = Department.objects.filter(name__iexact=department).first()
            category_name = session_data.get("category")
            cat_obj = None
            if category_name:
                cat_obj = ComplaintCategory.objects.filter(name__iexact=category_name).first()

            duplicates = []
            if state_obj and district_obj and dept_obj:
                duplicates_qs = Complaint.objects.filter(
                    is_deleted=False,
                    state=state_obj,
                    district=district_obj,
                    category=cat_obj,
                    department=dept_obj
                )
                latitude = entities.get("latitude")
                longitude = entities.get("longitude")
                if latitude and longitude:
                    try:
                        lat = float(latitude)
                        lon = float(longitude)
                        for c in duplicates_qs:
                            if c.latitude and c.longitude:
                                c_lat = float(c.latitude)
                                c_lon = float(c.longitude)
                                if abs(c_lat - lat) < 0.005 and abs(c_lon - lon) < 0.005:
                                    duplicates.append(c)
                    except ValueError:
                        pass
                else:
                    duplicates = list(duplicates_qs[:3])

            preview_data["duplicate_found"] = len(duplicates) > 0
            from complaints.serializers import ComplaintListSerializer
            preview_data["duplicates"] = ComplaintListSerializer(duplicates, many=True).data
            preview_data["original_description"] = session_data.get("description") or ""

            return Response(preview_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to generate preview: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )