# ai/services/knowledge_retriever.py
import re
from django.db.models import Prefetch
from knowledge.models import ComplaintType, ComplaintKeyword, RequiredField

class KnowledgeRetriever:
    """
    Search database-driven knowledge base.
    Uses ComplaintType, ComplaintKeyword, and RequiredField tables to match complaints.
    """

    def retrieve(self, preprocessed_text: str) -> dict:
        """
        Scores all active ComplaintTypes based on the keywords found in the user text.
        Returns the best match details or an empty structure if no match is found.
        """
        default_result = {
            "complaint_type": None,
            "category": None,
            "department": None,
            "priority": "MEDIUM",
            "estimated_resolution_days": 7,
            "required_fields": [],
            "matching_keywords": [],
            "confidence_score": 0.0
        }

        if not preprocessed_text:
            return default_result

        # Fetch all active ComplaintTypes and prefetch related keywords and required fields
        complaint_types = ComplaintType.objects.filter(is_active=True).prefetch_related(
            'keywords',
            'required_fields'
        )

        best_match = None
        best_score = 0.0
        best_matched_keywords = []

        for ct in complaint_types:
            score = 0.0
            matched_kws = []
            
            for kw in ct.keywords.all():
                # Word boundary check to avoid substring matches in larger unrelated words
                pattern = r"\b" + re.escape(kw.keyword.lower().strip()) + r"\b"
                if re.search(pattern, preprocessed_text):
                    score += kw.weight
                    matched_kws.append(kw.keyword)
            
            if score > best_score:
                best_score = score
                best_match = ct
                best_matched_keywords = matched_kws

        if not best_match:
            return default_result

        # Compute confidence score based on matching weight
        confidence = 0.0
        if best_score > 0:
            confidence = min(0.98, 0.70 + 0.10 * best_score)

        # Retrieve required fields
        req_fields = []
        for rf in best_match.required_fields.all():
            req_fields.append({
                "field_name": rf.field_name,
                "display_name": rf.display_name,
                "is_required": rf.is_required
            })

        return {
            "complaint_type": best_match.name,
            "category": best_match.category.name if best_match.category else None,
            "department": best_match.department.name if best_match.department else None,
            "priority": best_match.priority,
            "estimated_resolution_days": best_match.estimated_resolution_days,
            "required_fields": req_fields,
            "matching_keywords": best_matched_keywords,
            "confidence_score": confidence
        }
