from ai.services.intent_detector import IntentDetector
from ai.services.memory import MemoryManager


memory = MemoryManager()


class AIOrchestrator:

    def process(self, message: str, session_id: str):

        # Detect intent
        detector = IntentDetector()
        intent = detector.detect(message)

        # Save intent in memory
        memory.update_session(
            session_id,
            intent=intent.value
        )

        # Read updated session
        session = memory.get_session(session_id)

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

            # Temporary (for debugging)
            "memory": session
        }