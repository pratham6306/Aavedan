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
    BudgetAnalyticsView,
    CivicProjectListView,
    CivicProjectDetailView,
    CivicProjectVoteView,
    GroupProjectResolveView,
    GroupProjectVerifyView,
    GroupProjectProofVerifyView,
    OfficerResolveView,
    CitizenVerifyView,
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

    path(
        "budget-analytics/",
        BudgetAnalyticsView.as_view(),
        name="budget-analytics",
    ),

    path(
        "projects/",
        CivicProjectListView.as_view(),
        name="civic-project-list",
    ),

    path(
        "projects/<int:pk>/",
        CivicProjectDetailView.as_view(),
        name="civic-project-detail",
    ),

    path(
        "projects/<int:pk>/vote/",
        CivicProjectVoteView.as_view(),
        name="civic-project-vote",
    ),

    path(
        "projects/<int:pk>/resolve/",
        GroupProjectResolveView.as_view(),
        name="civic-project-resolve",
    ),

    path(
        "projects/<int:pk>/verify/",
        GroupProjectVerifyView.as_view(),
        name="civic-project-verify",
    ),

    path(
        "projects/proofs/<int:proof_id>/verify/",
        GroupProjectProofVerifyView.as_view(),
        name="civic-project-proof-verify",
    ),

    path(
        "<int:pk>/officer-resolve/",
        OfficerResolveView.as_view(),
        name="officer-resolve",
    ),

    path(
        "<int:pk>/verify-resolution/",
        CitizenVerifyView.as_view(),
        name="citizen-verify",
    ),
]