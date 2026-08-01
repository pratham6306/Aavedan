from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.generics import GenericAPIView, ListAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ComplaintFilter


from .permissions import IsComplaintOwner

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
    permission_classes = [IsAuthenticated, IsComplaintOwner,]

    def get(self, request, pk):
        complaint = get_object_or_404(
            Complaint,
            pk=pk,
            is_deleted=False,
        )
        self.check_object_permissions(
        request,
        complaint,
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