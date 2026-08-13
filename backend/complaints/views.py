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

        support, created = ComplaintSupport.objects.get_or_create(
            complaint=complaint,
            user=request.user
        )

        if not created:
            support.delete()
            return Response({
                "supported": False,
                "supports_count": complaint.supports.count(),
                "message": "Support removed."
            }, status=status.HTTP_200_OK)

        return Response({
            "supported": True,
            "supports_count": complaint.supports.count(),
            "message": "Grievance supported successfully!"
        }, status=status.HTTP_201_CREATED)


class ComplaintDuplicateCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        category_id = request.data.get("category")
        department_id = request.data.get("department")
        state_id = request.data.get("state")
        district_id = request.data.get("district")
        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        if not (category_id and department_id and state_id and district_id):
            return Response(
                {"error": "Missing required fields (category, department, state, district)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Base query for active, non-deleted complaints in the same state/district and category/department
        qs = Complaint.objects.filter(
            is_deleted=False,
            state_id=state_id,
            district_id=district_id,
            category_id=category_id,
            department_id=department_id
        )

        duplicates = []

        # Coordinate box comparison
        if latitude and longitude:
            try:
                lat = float(latitude)
                lon = float(longitude)
                for c in qs:
                    if c.latitude and c.longitude:
                        c_lat = float(c.latitude)
                        c_lon = float(c.longitude)
                        # ~500 meter coordinate bounding box
                        if abs(c_lat - lat) < 0.005 and abs(c_lon - lon) < 0.005:
                            duplicates.append(c)
            except ValueError:
                pass
        else:
            # If no coordinates, return top 3 matching general complaints in that district
            duplicates = list(qs[:3])

        if duplicates:
            return Response({
                "duplicate_found": True,
                "duplicates": ComplaintListSerializer(duplicates, many=True).data
            }, status=status.HTTP_200_OK)

        return Response({
            "duplicate_found": False,
            "duplicates": []
        }, status=status.HTTP_200_OK)