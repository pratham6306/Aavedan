# ai/services/decision_engine.py
from ai.constants import Intent, NextAction

class DecisionEngine:
    """
    State machine / Decision Engine to determine the AI's next conversational action
    based on intent, confidence, entities collected, and missing required parameters.
    """

    def decide(self, intent: Intent, confidence: float, complaint_type: str, session_data: dict, missing_fields: list) -> NextAction:
        """
        Calculates and returns the NextAction state.
        """
        # 1. Greetings, Help, Goodbye
        if intent == Intent.GREETING:
            return NextAction.ASK_COMPLAINT_DETAILS
        elif intent == Intent.GOODBYE:
            return NextAction.COMPLETE
        elif intent == Intent.HELP:
            return NextAction.ASK_COMPLAINT_DETAILS

        # 2. Search Schemes & Office Lookups
        elif intent == Intent.SEARCH_SCHEME:
            return NextAction.SHOW_SCHEME
        elif intent == Intent.OFFICE_LOOKUP:
            return NextAction.SHOW_OFFICE
        elif intent == Intent.TRACK_COMPLAINT:
            return NextAction.TRACK_COMPLAINT

        # 3. File Complaint Intent or Active Session Complaint Flow
        # Check if we already have a complaint_type in session OR the user wants to file one
        active_complaint = complaint_type or session_data.get("complaint_type")

        if intent == Intent.FILE_COMPLAINT or active_complaint:
            # Low confidence matched complaint type
            if active_complaint and confidence > 0 and confidence < 0.60:
                return NextAction.ASK_CLARIFICATION
            
            # No complaint type detected yet
            if not active_complaint:
                return NextAction.ASK_COMPLAINT_DETAILS

            # We have an active complaint type; check for missing fields
            if missing_fields:
                next_missing = missing_fields[0]
                if next_missing == "state":
                    return NextAction.ASK_STATE
                elif next_missing == "district":
                    return NextAction.ASK_DISTRICT
                elif next_missing == "address":
                    return NextAction.ASK_ADDRESS
                elif next_missing == "landmark":
                    return NextAction.ASK_LANDMARK
                elif next_missing in ["image", "photo"]:
                    pass
                else:
                    return NextAction.ASK_REQUIRED_FIELDS

            # All required fields present
            # If the user has confirmed filing, we move to FILE_COMPLAINT (which shows filing instructions)
            if session_data.get("confirmed") or intent == Intent.CONFIRM:
                return NextAction.FILE_COMPLAINT
            else:
                return NextAction.CONFIRM_AND_FILE

        # 4. Handle confirmation intent outside explicit FILE_COMPLAINT flow
        if intent == Intent.CONFIRM:
            if session_data.get("next_action") == NextAction.CONFIRM_AND_FILE.value:
                return NextAction.FILE_COMPLAINT

        # 5. Default Fallback
        # Retain active scheme search context if user is still explaining their query
        if session_data.get("next_action") == NextAction.SHOW_SCHEME.value:
            return NextAction.SHOW_SCHEME

        return NextAction.ASK_COMPLAINT_DETAILS
