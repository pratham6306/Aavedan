# ai/serializers.py
from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    message = serializers.CharField(max_length=5000)
    entities = serializers.JSONField(required=False)
    image_base64 = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ChatResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    reply = serializers.CharField()
    message = serializers.CharField() # Map same text to 'message' for the new common format
    
    intent = serializers.CharField()
    confidence = serializers.FloatField()
    
    complaint_type = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    category = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    department = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    office = serializers.DictField(
        required=False,
        allow_null=True
    )
    
    entities = serializers.DictField(
        required=False
    )
    
    missing_fields = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    
    next_action = serializers.CharField()
    recommendations = serializers.JSONField(required=False)


class SendEmailRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()


class SendEmailResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()