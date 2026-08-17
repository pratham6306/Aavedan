# ai/services/complaint_analyzer.py
from ai.services.knowledge_retriever import KnowledgeRetriever

class ComplaintAnalyzer:
    """
    Analyzes user message and extracts/validates complaint details by delegating
    to KnowledgeRetriever. Identifies missing required fields based on session state.
    """

    def __init__(self):
        self.knowledge_retriever = KnowledgeRetriever()

    def analyze(self, preprocessed_text: str, session_data: dict, image_base64: str | None = None) -> dict:
        """
        Analyzes preprocessed user text and current session data by calling the
        FastAPI AI microservice, with a robust fallback to database keyword matching.
        """
        import requests
        from django.conf import settings

        retriever_result = {
            "complaint_type": None,
            "category": None,
            "department": None,
            "priority": "medium",
            "estimated_resolution_days": 7,
            "required_fields": [],
            "matching_keywords": [],
            "confidence_score": 0.0
        }

        # Try calling the external AI microservice (if not running unit tests)
        import sys
        if len(sys.argv) > 1 and sys.argv[1] == 'test':
            # Avoid calling the live API and eating up quota during test runs
            retriever_result = self.knowledge_retriever.retrieve(preprocessed_text)
            response = None
        else:
            ai_url = getattr(settings, "AI_SERVICE_URL", "http://localhost:8010")
            try:
                payload = {
                    "text": preprocessed_text,
                    "image_base64": image_base64
                }
                response = requests.post(f"{ai_url}/api/v1/complaints/classify", json=payload, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    
                    # Fetch categories and required fields from database to match the resolved category
                    from categories.models import ComplaintCategory
                    from knowledge.models import ComplaintType
                    
                    category_code = data.get("category_code")
                    category_mapping = {
                        "ROAD_DAMAGE": "Road & Infrastructure",
                        "WATER_SUPPLY": "Water Supply",
                        "ELECTRICITY": "Electricity",
                        "GARBAGE_COLLECTION": "Sanitation & Waste",
                        "DRAINAGE": "Drainage & Sewerage",
                        "PUBLIC_SAFETY": "Public Safety",
                    }
                    db_category_name = category_mapping.get(category_code, "Road & Infrastructure")
                    
                    # Fetch category from DB to ensure correct casing
                    from categories.models import ComplaintCategory
                    from knowledge.models import ComplaintType
                    db_cat = ComplaintCategory.objects.filter(name__iexact=db_category_name).first()
                    resolved_category_name = db_cat.name if db_cat else db_category_name
                    
                    ct = None
                    entities = data.get("entities", {})
                    issue_type = entities.get("issue_type") if isinstance(entities, dict) else None
                    if issue_type:
                        # Try matching the ComplaintType by name or slug under this category
                        ct = ComplaintType.objects.filter(
                            category__name__iexact=resolved_category_name,
                            name__icontains=issue_type
                        ).first()
                        if not ct:
                            ct = ComplaintType.objects.filter(
                                category__name__iexact=resolved_category_name,
                                slug__icontains=issue_type.replace(" ", "-")
                            ).first()
                    if not ct:
                        # Fallback to the first complaint type under that category
                        ct = ComplaintType.objects.filter(category__name__iexact=resolved_category_name).first()
                    
                    # If still not found (edge case), fallback to the first one in the DB
                    if not ct:
                        ct = ComplaintType.objects.first()

                    req_fields = []
                    if ct:
                        for rf in ct.required_fields.all():
                            req_fields.append({
                                "field_name": rf.field_name,
                                "display_name": rf.display_name,
                                "is_required": rf.is_required
                            })

                    retriever_result = {
                        "complaint_type": ct.name if ct else data.get("category_display_name"),
                        "category": resolved_category_name,
                        "department": ct.department.name if (ct and ct.department) else data.get("department_name"),
                        "priority": data.get("priority") or (ct.priority if ct else "medium"),
                        "estimated_resolution_days": ct.estimated_resolution_days if ct else 7,
                        "required_fields": req_fields,
                        "matching_keywords": [category_code] if category_code else [],
                        "confidence_score": data.get("confidence", 0.90)
                    }
                else:
                    print(f"Warning: AI microservice returned status {response.status_code}, falling back to rules-based analyzer.")
                    retriever_result = self.knowledge_retriever.retrieve(preprocessed_text)
            except Exception as e:
                print(f"Warning: Failed to contact AI microservice: {str(e)}, falling back to rules-based analyzer.")
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
                        if name in ["photo", "image", "images"]:
                            # Photos are optional visual evidence; do not block conversational filing
                            continue
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

        # Generate a clean, professional 3-line offline formal description using department, location, and issue
        comp_type = analysis.get("complaint_type") or "Civic Grievance"
        dept = analysis.get("department") or "Municipal Authority"
        cat = analysis.get("category") or "Public Infrastructure"
        
        entities_dict = session_data.get("entities", {}) if isinstance(session_data.get("entities"), dict) else {}
        loc_parts = []
        for loc_k in ["address", "landmark", "district", "state"]:
            val = session_data.get(loc_k) or entities_dict.get(loc_k)
            if val:
                loc_parts.append(str(val))
        
        loc_str = ", ".join(loc_parts) if loc_parts else "specified municipal area"

        line1 = f"Official Grievance Notice regarding {comp_type} reported under {dept} ({cat})."
        line2 = f"Location & Site details: {loc_str}."
        line3 = f"Public Urgency: Escalated for immediate municipal inspection and resolution dispatch."
        
        analysis["generated_description"] = f"{line1}\n{line2}\n{line3}"

        return analysis