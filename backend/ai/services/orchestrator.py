from ai.services.intent_detector import IntentDetector
from ai.services.memory import MemoryManager
from ai.services.complaint_analyzer import ComplaintAnalyzer
from ai.services.response_generator import ResponseGenerator


class AIOrchestrator:

    def __init__(self):
        self.intent_detector = IntentDetector()
        self.memory = MemoryManager()
        self.complaint_analyzer = ComplaintAnalyzer()
        self.response_generator = ResponseGenerator()

    def process(self, message: str, session_id: str):

        # Step 1: Detect Intent
        intent = self.intent_detector.detect(message)

        # Step 2: Analyze Complaint
        analysis = self.complaint_analyzer.analyze(
            message=message,
            intent=intent
        )

        # Step 3: Update Memory
        self.memory.update_session(
            session_id,
            intent=intent.value,
            complaint_type=analysis["complaint_type"],
            category=analysis["category"],
            department=analysis["department"],
            awaiting_field=(
                analysis["missing_fields"][0]
                if analysis["missing_fields"]
                else None
            )
        )

        # Step 4: Read Updated Session
        session = self.memory.get_session(session_id)

        # Step 5: Generate Response
        return self.response_generator.generate(
            session=session,
            analysis=analysis,
            intent=intent
        )