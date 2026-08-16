import django_filters

from .models import Complaint


class ComplaintFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(method="filter_status")
    priority = django_filters.CharFilter(field_name="priority", lookup_expr="iexact")
    category = django_filters.CharFilter(field_name="category__name", lookup_expr="iexact")
    department = django_filters.CharFilter(field_name="department__name", lookup_expr="iexact")
    district = django_filters.CharFilter(field_name="district__name", lookup_expr="iexact")
    state = django_filters.CharFilter(field_name="state__name", lookup_expr="iexact")

    def filter_status(self, queryset, name, value):
        val = value.lower().strip()
        if val in ["review", "under_review", "under review", "in_progress", "in progress"]:
            return queryset.filter(status__name__in=["review", "under_review", "Under Review", "In Progress", "in_progress"])
        return queryset.filter(status__name__iexact=val)


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