import django_filters
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .services import GovernmentSchemeService

from .models import GovernmentScheme
from .serializers import GovernmentSchemeListSerializer, GovernmentSchemeDetailSerializer


class GovernmentSchemeFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__name", lookup_expr="iexact")
    department = django_filters.CharFilter(field_name="department__name", lookup_expr="iexact")
    state = django_filters.CharFilter(field_name="state__name", lookup_expr="iexact")

    class Meta:
        model = GovernmentScheme
        fields = ["category", "department", "state"]


class GovernmentSchemeListView(ListAPIView):
    serializer_class = GovernmentSchemeListSerializer
    permission_classes = [AllowAny]
    filterset_class = GovernmentSchemeFilter

    queryset = GovernmentScheme.objects.filter(
        is_deleted=False,
        is_active=True,
    )

    search_fields = (
        "scheme_name",
        "scheme_code",
        "keywords",
    )

    ordering_fields = (
        "scheme_name",
        "created_at",
    )

    ordering = (
        "scheme_name",
    )

class GovernmentSchemeDetailView(RetrieveAPIView):
    serializer_class = GovernmentSchemeDetailSerializer
    permission_classes = [AllowAny]

    lookup_field = "pk"

    def get_object(self):
        return GovernmentSchemeService.get_scheme_by_id(
            self.kwargs["pk"]
        )