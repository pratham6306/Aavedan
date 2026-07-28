from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    message = serializers.CharField(max_length=5000)


class ChatResponseSerializer(serializers.Serializer):
    reply = serializers.CharField()

    intent = serializers.CharField()

    complaint_type = serializers.CharField(
        required=False,
        allow_blank=True
    )

    category = serializers.CharField(
        required=False,
        allow_blank=True
    )

    department = serializers.CharField(
        required=False,
        allow_blank=True
    )

    confidence = serializers.FloatField()

    needs_clarification = serializers.BooleanField()

    missing_fields = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )

    next_action = serializers.CharField()