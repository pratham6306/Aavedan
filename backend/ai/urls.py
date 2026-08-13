from django.urls import path
from .views import ChatAPIView, SendGrievanceEmailAPIView, GrievanceEmailPreviewAPIView

urlpatterns = [
    path(
        "chat/",
        ChatAPIView.as_view(),
        name="ai-chat",
    ),
    path(
        "chat/send-email/",
        SendGrievanceEmailAPIView.as_view(),
        name="ai-send-email",
    ),
    path(
        "chat/email-preview/",
        GrievanceEmailPreviewAPIView.as_view(),
        name="ai-email-preview",
    ),
]
