from django.urls import path

from .views import (
    ComplaintCreateView,
    ComplaintListView,
    ComplaintDetailView,
    ComplaintUpdateView,
    ComplaintDeleteView,
    ComplaintImageUploadView,
    MyComplaintListView,
    CategoryListAPIView,
    DepartmentListAPIView,
    ComplaintSupportView,
    ComplaintDuplicateCheckView,
)

urlpatterns = [
    path(
        "",
        ComplaintListView.as_view(),
        name="complaint-list",
    ),

    path(
        "create/",
        ComplaintCreateView.as_view(),
        name="complaint-create",
    ),

    path(
        "categories/",
        CategoryListAPIView.as_view(),
        name="complaint-categories",
    ),

    path(
        "departments/",
        DepartmentListAPIView.as_view(),
        name="complaint-departments",
    ),

    path(
        "my/",
        MyComplaintListView.as_view(),
        name="my-complaints",
    ),

    path(
        "<int:pk>/",
        ComplaintDetailView.as_view(),
        name="complaint-detail",
    ),

    path(
        "<int:pk>/update/",
        ComplaintUpdateView.as_view(),
        name="complaint-update",
    ),

    path(
        "<int:pk>/delete/",
        ComplaintDeleteView.as_view(),
        name="complaint-delete",
    ),

    path(
        "<int:pk>/upload-images/",
        ComplaintImageUploadView.as_view(),
        name="complaint-upload-images",
    ),

    path(
        "check-duplicate/",
        ComplaintDuplicateCheckView.as_view(),
        name="complaint-check-duplicate",
    ),

    path(
        "<int:pk>/support/",
        ComplaintSupportView.as_view(),
        name="complaint-support",
    ),
]