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

    def process(self, message: str, session_id: str, image_base64: str | None = None) -> dict:
        """
        Orchestrates the entire request lifecycle.
        """
        # 1. Fetch current session state
        session = self.memory.get_session(session_id)

        # 2. Preprocess message
        clean_msg = self.preprocessor.preprocess(message)

        # 3. Detect intent
        intent = self.intent_detector.detect(clean_msg)

        prev_action = session.get("next_action")
        active_complaint = session.get("complaint_type")
        is_previous_flow_completed = bool(session.get("confirmed") or prev_action == NextAction.CONFIRM_AND_FILE.value)
        has_explicit_new_desc = bool("description:" in message.lower())

        # Clear stale complaint session memory when switching to SCHEME or OFFICE intent, or when starting a fresh complaint
        if (intent in [Intent.SEARCH_SCHEME, Intent.OFFICE_LOOKUP]) or (intent == Intent.FILE_COMPLAINT and (is_previous_flow_completed or has_explicit_new_desc)) or (has_explicit_new_desc and active_complaint):
            self.memory.clear_session(session_id)
            session = self.memory.get_session(session_id)
            prev_action = None
            active_complaint = None

        # Parse structured text fields (Description:, Address:, Landmark:, State:, District:) if provided
        structured_entities = {}
        for key, label in [("address", "Address:"), ("landmark", "Landmark:"), ("state", "State:"), ("district", "District:")]:
            if label in message:
                try:
                    val = message.split(label)[1]
                    for other in ["Address:", "State:", "District:", "Landmark:", "Category:", "Description:"]:
                        if other != label and other in val:
                            val = val.split(other)[0]
                    val = val.strip()
                    if val and not val.lower().startswith("please help me"):
                        structured_entities[key] = val
                except Exception:
                    pass
        if structured_entities:
            self.memory.update_session(session_id, entities=structured_entities)

        # Extract description text
        desc_text = message.strip()
        if "Description:" in message:
            try:
                after_desc = message.split("Description:")[1]
                for label in ["Address:", "State:", "District:", "Landmark:", "Category:"]:
                    if label in after_desc:
                        after_desc = after_desc.split(label)[0]
                extracted_desc = after_desc.strip()
                if extracted_desc:
                    desc_text = extracted_desc
            except Exception:
                pass

        prev_action = session.get("next_action")
        active_complaint = session.get("complaint_type")

        # Save initial description if a complaint flow is triggered
        # (Do NOT overwrite description when user is merely answering location/address questions)
        is_answering_location = prev_action in [
            NextAction.ASK_STATE.value, NextAction.ASK_DISTRICT.value, 
            NextAction.ASK_ADDRESS.value, NextAction.ASK_LANDMARK.value, NextAction.ASK_PHOTO.value
        ]
        
        if (intent == Intent.FILE_COMPLAINT and not session.get("description")) or ("description:" in message.lower()):
            if desc_text and not is_answering_location:
                self.memory.update_session(session_id, description=desc_text)

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
            analysis = self.complaint_analyzer.analyze(clean_msg, session, image_base64=image_base64)
            
            # If a new complaint type was resolved or previous session was confirmed, use new values
            if analysis.get("complaint_type") or session.get("confirmed"):
                resolved_ct = analysis.get("complaint_type") or session.get("complaint_type")
                resolved_cat = analysis.get("category") or session.get("category")
                resolved_dept = analysis.get("department") or session.get("department")
            else:
                resolved_ct = session.get("complaint_type")
                resolved_cat = session.get("category")
                resolved_dept = session.get("department")

            # Update database-derived complaint info and generated description
            gen_desc = analysis.get("generated_description")
            self.memory.update_session(
                session_id,
                complaint_type=resolved_ct,
                category=resolved_cat,
                department=resolved_dept,
                priority=analysis.get("priority", "medium"),
                confidence=analysis.get("confidence", 0.0) if analysis.get("confidence", 0.0) > 0 else session.get("confidence", 0.0),
                missing_fields=analysis.get("missing_fields", []),
                generated_description=gen_desc
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

        # Intercept schemes recommendation if user query is specific
        if intent == Intent.SEARCH_SCHEME:
            import requests
            from django.conf import settings
            from schemes.models import GovernmentScheme
            
            schemes_qs = GovernmentScheme.objects.filter(is_active=True, is_deleted=False).prefetch_related('required_documents')
            schemes_payload = []
            for s in schemes_qs:
                schemes_payload.append({
                    "id": s.id,
                    "scheme_name": s.scheme_name,
                    "description": s.description,
                    "benefits": s.benefits,
                    "eligibility": s.eligibility,
                    "keywords": s.keywords or "",
                    "required_documents": [d.document_name for d in s.required_documents.all()]
                })
                
            import sys
            recs = []
            if 'test' not in sys.argv:
                ai_url = getattr(settings, "AI_SERVICE_URL", "http://localhost:8010")
                try:
                    payload = {
                        "user_description": message,
                        "schemes": schemes_payload
                    }
                    res = requests.post(f"{ai_url}/api/v1/schemes/recommend", json=payload, timeout=15)
                    if res.status_code == 200:
                        rec_data = res.json()
                        recs = rec_data.get("recommendations", [])
                except Exception as e:
                    print(f"Warning: Failed to get AI scheme recommendations: {str(e)}")

            # Fallback to database-driven keyword search if AI recommendation was empty, bypassed, or failed
            if not recs:
                matched_recs = []
                query_words = set(clean_msg.split())
                
                # Filter out generic stop words to avoid dumb matches (e.g. matching on the word "scheme" or "yojana")
                STOP_WORDS = {
                    "scheme", "schemes", "yojana", "yojanas", "welfare", "government",
                    "passed", "student", "students", "want", "about", "query", "details",
                    "need", "help", "please", "file", "official", "grievance", "crop",
                    "complaint", "issue", "problem", "there", "their", "this", "some",
                    "any", "for", "me", "what", "which", "who", "whom", "whose", "how"
                }
                
                # Check for common topics in query (robust matching with substrings and spelling variations)
                is_education = any("schol" in w or "schlor" in w or "scholl" in w or "stud" in w or "sttud" in w or "stdy" in w or "educ" in w or w in ["10th", "matric", "studies", "school", "schooling"] for w in query_words)
                is_housing = any("hous" in w or w in ["ghar", "biju", "pucca"] for w in query_words)
                is_farming = any("farm" in w or "crop" in w or "agri" in w or w == "relief" for w in query_words)
                
                requested_category = None
                if is_education:
                    requested_category = "Education"
                elif is_housing:
                    requested_category = "Housing"
                elif is_farming:
                    requested_category = "Agriculture"

                for s in schemes_qs:
                    # Enforce domain category mapping to filter out completely irrelevant schemes
                    if requested_category and s.category.name != requested_category:
                        continue

                    eligibility_lower = s.eligibility.lower()
                    desc_lower = s.description.lower()
                    name_lower = s.scheme_name.lower()
                    keywords_lower = (s.keywords or "").lower()
                    
                    matched = False
                    reason = "Matches your query details."
                    is_eligible = True
                    
                    if is_education:
                        matched = True
                        reason = "Recommended based on educational and study criteria."
                    elif is_housing:
                        matched = True
                        reason = "Recommended based on housing support interest."
                    elif is_farming:
                        matched = True
                        reason = "Recommended based on agricultural/farming interest."
                    else:
                        # Direct keyword search matching (ignoring generic stop words)
                        for word in query_words:
                            if word not in STOP_WORDS and len(word) > 3 and word in (name_lower + desc_lower + keywords_lower):
                                matched = True
                                reason = f"Matches keyword: {word}"
                                break
                    
                    if matched:
                        # Determine simple eligibility based on 10th pass etc.
                        if "10th" in clean_msg or "passed student" in clean_msg:
                            if "10th" in eligibility_lower or "matric" in eligibility_lower or "scholarship" in eligibility_lower or "scholorship" in eligibility_lower:
                                is_eligible = True
                                reason = "You meet the basic educational eligibility criteria (10th/Matric pass)."

                        # Enforce state residency checks if state info is available in the session
                        user_state = session.get("entities", {}).get("state") or session.get("state")
                        if s.state and user_state:
                            if s.state.name.lower() != user_state.lower():
                                is_eligible = False
                                reason = f"Your current state is {user_state.title()}, but this scheme is only for residents of {s.state.name}."
                        
                        matched_recs.append({
                            "scheme_id": s.id,
                            "scheme_name": s.scheme_name,
                            "is_eligible": is_eligible,
                            "matching_reason": reason,
                            "required_documents": [d.document_name for d in s.required_documents.all()],
                            "filling_instructions": f"1. Apply online via the official portal.\n2. Submit documents: {', '.join([d.document_name for d in s.required_documents.all()])}."
                        })
                recs = matched_recs

            # If the user query is not explicitly asking "why" or "reason", filter out ineligible schemes
            show_ineligible = any(w in clean_msg for w in ["why", "reason", "fail", "not eligible"])
            if not show_ineligible:
                recs = [r for r in recs if r.get("is_eligible") is True or str(r.get("is_eligible")).lower() == "true"]

            if recs:
                reply_lines = ["Based on your circumstances, here are the welfare schemes you may qualify for:\n"]
                for r in recs:
                    emoji = "✅" if r["is_eligible"] else "❌"
                    status_text = "Eligible" if r["is_eligible"] else "Not Eligible"
                    reply_lines.append(f"### {emoji} {r['scheme_name']} ({status_text})")
                    reply_lines.append(f"**Why:** {r['matching_reason']}")
                    if r["is_eligible"]:
                        if r["required_documents"]:
                            docs_str = ", ".join(r["required_documents"])
                            reply_lines.append(f"**Required Documents:** {docs_str}")
                        reply_lines.append(f"**How to apply:**\n{r['filling_instructions']}")
                    reply_lines.append("\n" + "-"*40 + "\n")
                
                custom_reply = "\n".join(reply_lines)
                response["reply"] = custom_reply
                response["message"] = custom_reply
                response["recommendations"] = recs
            else:
                custom_reply = "I couldn't find any matching welfare schemes for your query in our database."
                response["reply"] = custom_reply
                response["message"] = custom_reply
                response["recommendations"] = []

        # 10. Clear memory if flow has ended (COMPLETE or FILE_COMPLAINT guidance is shown)
        if next_action in [NextAction.COMPLETE, NextAction.FILE_COMPLAINT]:
            self.memory.clear_session(session_id)

        return response