from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import State, District
from .serializers import StateSerializer, DistrictSerializer

class StateListView(ListAPIView):
    serializer_class = StateSerializer
    permission_classes = [AllowAny]
    queryset = State.objects.all().order_name() if hasattr(State.objects, 'order_name') else State.objects.all().order_by('name')
    pagination_class = None  # disable pagination to get all states at once

class DistrictListView(ListAPIView):
    serializer_class = DistrictSerializer
    permission_classes = [AllowAny]
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
