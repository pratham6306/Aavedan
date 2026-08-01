# ai/services/orchestrator.py
from ai.constants import Intent, NextAction
from ai.services.text_preprocessor import TextPreprocessor
from ai.services.intent_detector import IntentDetector
from ai.services.complaint_analyzer import ComplaintAnalyzer
from ai.services.location_extractor import LocationExtractor
from ai.services.department_resolver import DepartmentResolver
from ai.services.office_finder import OfficeFinder
from ai.services.decision_engine import DecisionEngine
from ai.services.memory import MemoryManager
from ai.services.response_generator import ResponseGenerator


class AIOrchestrator:
    """
    Core orchestrator coordinating all individual AI services in a clean, stateful manner.
    """

    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.intent_detector = IntentDetector()
        self.complaint_analyzer = ComplaintAnalyzer()
        self.location_extractor = LocationExtractor()
        self.department_resolver = DepartmentResolver()
        self.office_finder = OfficeFinder()
        self.decision_engine = DecisionEngine()
        self.memory = MemoryManager()
        self.response_generator = ResponseGenerator()

    def process(self, message: str, session_id: str) -> dict:
        """
        Orchestrates the entire request lifecycle.
        """
        # 1. Fetch current session state
        session = self.memory.get_session(session_id)

        # 2. Preprocess message
        clean_msg = self.preprocessor.preprocess(message)

        # 3. Detect intent
        intent = self.intent_detector.detect(clean_msg)

        # Save initial description if a complaint flow is triggered and description is empty
        if (intent == Intent.FILE_COMPLAINT or session.get("complaint_type")) and not session.get("description"):
            if not message.strip().startswith("Please help me"):
                self.memory.update_session(session_id, description=message.strip())

        # 4. Handle context-aware answers in active flows
        prev_action = session.get("next_action")
        active_complaint = session.get("complaint_type")

        # If user is responding to a question in a complaint flow
        if active_complaint and prev_action:
            if prev_action in [NextAction.ASK_STATE.value, NextAction.ASK_DISTRICT.value, 
                              NextAction.ASK_ADDRESS.value, NextAction.ASK_LANDMARK.value]:
                # Extract locations contextually
                awaiting_field = prev_action.replace("ASK_", "")
                extracted = self.location_extractor.extract(message, clean_msg, awaiting_field=awaiting_field)
                self.memory.update_session(session_id, entities=extracted)
            
            elif prev_action in [NextAction.ASK_REQUIRED_FIELDS.value, NextAction.ASK_PHOTO.value]:
                missing = session.get("missing_fields", [])
                if missing:
                    missing_field = missing[0]
                    # Update entities dict with user response
                    self.memory.update_session(session_id, entities={missing_field: message.strip()})

            elif prev_action == NextAction.CONFIRM_AND_FILE.value:
                if intent == Intent.CONFIRM:
                    self.memory.update_session(session_id, confirmed=True)

        # 5. Extract general location parameters if we are lodging a new complaint
        if intent == Intent.FILE_COMPLAINT:
            general_locations = self.location_extractor.extract(message, clean_msg)
            self.memory.update_session(session_id, entities=general_locations)

        # Refresh session reference
        session = self.memory.get_session(session_id)

        # 6. Analyze complaint parameters (only if we have matched or are matching a complaint)
        if intent == Intent.FILE_COMPLAINT or session.get("complaint_type"):
            analysis = self.complaint_analyzer.analyze(clean_msg, session)
            
            # Update database-derived complaint info
            self.memory.update_session(
                session_id,
                complaint_type=analysis["complaint_type"] or session.get("complaint_type"),
                category=analysis["category"] or session.get("category"),
                department=analysis["department"] or session.get("department"),
                priority=analysis["priority"],
                confidence=analysis["confidence"] if analysis["confidence"] > 0 else session.get("confidence", 0.0),
                missing_fields=analysis["missing_fields"]
            )

        # Refresh session reference
        session = self.memory.get_session(session_id)

        # 7. Decide Next Action
        next_action = self.decision_engine.decide(
            intent=intent,
            confidence=session.get("confidence", 0.0),
            complaint_type=session.get("complaint_type"),
            session_data=session,
            missing_fields=session.get("missing_fields", [])
        )
        self.memory.update_session(session_id, intent=intent.value, next_action=next_action.value)

        # Refresh session reference
        session = self.memory.get_session(session_id)

        # 8. Query Office details if location & department are resolved
        office_details = {}
        entities = session.get("entities", {})
        state_val = entities.get("state")
        district_val = entities.get("district")
        dept_val = session.get("department")

        if state_val and district_val and dept_val:
            office_details = self.office_finder.find_office(
                department_name=dept_val,
                district_name=district_val,
                state_name=state_val
            )

        # 9. Generate reply and format final API response
        response = self.response_generator.generate(session, office_details)

        # 10. Clear memory if flow has ended (COMPLETE or FILE_COMPLAINT guidance is shown)
        if next_action in [NextAction.COMPLETE, NextAction.FILE_COMPLAINT]:
            self.memory.clear_session(session_id)

        return response