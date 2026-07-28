from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    ChatRequestSerializer,
    ChatResponseSerializer,
)
from .services.orchestrator import AIOrchestrator
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