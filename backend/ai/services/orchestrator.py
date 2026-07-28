from ai.services.intent_detector import IntentDetector


class AIOrchestrator:

    def process(self, message: str, session_id: str):

        detector = IntentDetector()
        intent = detector.detect(message)

        return {
            "reply": (
                "Hello! I'm Aavedan Saathi. "
                "I received your message and the AI pipeline is working."
            ),
            "intent": intent.value,
            "complaint_type": "",
            "category": "",
            "department": "",
            "confidence": 1.0,
            "needs_clarification": False,
            "missing_fields": [],
            "next_action": "none",
        }

    