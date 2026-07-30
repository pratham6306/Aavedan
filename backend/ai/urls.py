from django.urls import path

from .views import ChatAPIView, SendGrievanceEmailAPIView

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
]