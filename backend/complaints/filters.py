import django_filters

from .models import Complaint


class ComplaintFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status__name", lookup_expr="iexact")
    priority = django_filters.CharFilter(field_name="priority", lookup_expr="iexact")
    category = django_filters.CharFilter(field_name="category__name", lookup_expr="iexact")
    department = django_filters.CharFilter(field_name="department__name", lookup_expr="iexact")
    district = django_filters.CharFilter(field_name="district__name", lookup_expr="iexact")
    state = django_filters.CharFilter(field_name="state__name", lookup_expr="iexact")

    class Meta:
        model = Complaint
        fields = (
            "status",
            "priority",
            "category",
            "department",
            "district",
            "state",
        )