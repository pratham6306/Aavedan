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


class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        orchestrator = AIOrchestrator()

        result = orchestrator.process(
            message=serializer.validated_data["message"],
            session_id=str(serializer.validated_data["session_id"]),
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
        entities = session_data.get("entities", {})
        state = entities.get("state")
        district = entities.get("district")

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
        dispatcher = EmailDispatcher()
        try:
            dispatcher.send_grievance_email(session_data, user_email)
            
            # Clear session memory upon successful dispatch
            memory.clear_session(session_id)

            response_data = {
                "success": True,
                "message": f"Grievance email dispatched successfully to {office_name} ({office_email})."
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": f"Failed to send email: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )