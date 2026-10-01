from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import State, District
from .serializers import StateSerializer, DistrictSerializer

class StateListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = StateSerializer
    queryset = State.objects.all().order_by('name')
    pagination_class = None  # disable pagination to get all states at once

class DistrictListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = DistrictSerializer
    pagination_class = None  # disable pagination

    def get_queryset(self):
        queryset = District.objects.all().order_by('name')
        state_param = self.request.query_params.get('state_id') or self.request.query_params.get('state')
        if state_param:
            if str(state_param).isdigit():
                queryset = queryset.filter(state_id=state_param)
            else:
                queryset = queryset.filter(state__name__iexact=state_param)
        return queryset


from rest_framework.views import APIView
from rest_framework.response import Response

class SeedDatabaseView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            import seed_categories
            import seed_departments
            import seed_knowledge
            import seed_locations
            import seed_schemes
            return Response({
                "success": True,
                "message": "Database seeded successfully with all Categories, Departments, Knowledge Base, 36 States/Districts, and Welfare Schemes!"
            })
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=500)

