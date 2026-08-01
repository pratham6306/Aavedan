# ai/services/complaint_analyzer.py
from ai.services.knowledge_retriever import KnowledgeRetriever

class ComplaintAnalyzer:
    """
    Analyzes user message and extracts/validates complaint details by delegating
    to KnowledgeRetriever. Identifies missing required fields based on session state.
    """

    def __init__(self):
        self.knowledge_retriever = KnowledgeRetriever()

    def analyze(self, preprocessed_text: str, session_data: dict) -> dict:
        """
        Analyzes preprocessed user text and current session data.
        Returns a dict of extracted details and missing required fields.
        """
        # 1. Retrieve knowledge-base matching results from current text
        retriever_result = self.knowledge_retriever.retrieve(preprocessed_text)

        # 2. Determine active complaint type
        active_type_name = retriever_result["complaint_type"] or session_data.get("complaint_type")

        if active_type_name and not retriever_result["complaint_type"]:
            # Load active type from database to avoid resetting parameters
            from knowledge.models import ComplaintType
            try:
                ct = ComplaintType.objects.get(name=active_type_name, is_active=True)
                retriever_result = {
                    "complaint_type": ct.name,
                    "category": ct.category.name if ct.category else None,
                    "department": ct.department.name if ct.department else None,
                    "priority": ct.priority,
                    "estimated_resolution_days": ct.estimated_resolution_days,
                    "required_fields": [
                        {
                            "field_name": rf.field_name,
                            "display_name": rf.display_name,
                            "is_required": rf.is_required
                        }
                        for rf in ct.required_fields.all()
                    ],
                    "matching_keywords": [],
                    "confidence_score": session_data.get("confidence", 0.0) # Retain previous confidence
                }
            except ComplaintType.DoesNotExist:
                pass

        # 3. Default analysis structure
        analysis = {
            "complaint_type": session_data.get("complaint_type") or retriever_result["complaint_type"],
            "category": session_data.get("category") or retriever_result["category"],
            "department": session_data.get("department") or retriever_result["department"],
            "priority": session_data.get("priority") or retriever_result["priority"] or "medium",
            "estimated_resolution_days": retriever_result["estimated_resolution_days"] or 7,
            "confidence": session_data.get("confidence", 1.0) if session_data.get("complaint_type") else (retriever_result["confidence_score"] if retriever_result["complaint_type"] else 1.0),
            "missing_fields": [],
            "required_fields_list": retriever_result["required_fields"] if retriever_result["complaint_type"] else [],
            "matching_keywords": retriever_result["matching_keywords"],
            "needs_clarification": False
        }

        # 4. If a complaint type is active, evaluate missing required fields
        if analysis["complaint_type"]:
            missing_fields = []
            
            # State is always required for routing to the correct department office
            state_val = session_data.get("state") or session_data.get("entities", {}).get("state")
            if not state_val:
                missing_fields.append("state")

            # Check fields required by the specific ComplaintType from DB
            if retriever_result["required_fields"]:
                for field in retriever_result["required_fields"]:
                    if field["is_required"]:
                        name = field["field_name"]
                        val = session_data.get(name) or session_data.get("entities", {}).get(name)
                        if not val:
                            missing_fields.append(name)
            else:
                # For fallback/preloaded complaints, make sure district and address are present
                for req_f in ["district", "address"]:
                    val = session_data.get(req_f) or session_data.get("entities", {}).get(req_f)
                    if not val:
                        missing_fields.append(req_f)
            
            # Sort missing fields logically: state, then district, then address, then landmark, then any others
            logical_order = ["state", "district", "address", "landmark"]
            sorted_missing = []
            for field_name in logical_order:
                if field_name in missing_fields:
                    sorted_missing.append(field_name)
            for field_name in missing_fields:
                if field_name not in sorted_missing:
                    sorted_missing.append(field_name)
            analysis["missing_fields"] = sorted_missing

            # Determine clarification flag
            if analysis["confidence"] < 0.60:
                analysis["needs_clarification"] = True
        else:
            # If no complaint type is matched, we need clarification/details
            analysis["needs_clarification"] = True

        return analysis