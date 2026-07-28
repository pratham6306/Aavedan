# ai/services/complaint_analyzer.py

from ai.services.intent_detector import Intent


class ComplaintAnalyzer:
    """
    Analyzes a user message and extracts structured complaint information.

    Current Version:
    - Rule-based

    Future Version:
    - ML/NLP powered
    """

    def analyze(self, message: str, intent: Intent) -> dict:

        # Default response structure
        analysis = {
            "complaint_type": None,
            "category": None,
            "department": None,
            "confidence": 0.0,
            "needs_clarification": False,
            "missing_fields": [],
            "next_action": "none",
        }

        # Only analyze complaint messages
        if intent != Intent.COMPLAINT:
            return analysis

        text = message.lower()

        # ----------------------------
        # Road Complaints
        # ----------------------------

        pothole_keywords = [
            "pothole",
            "road broken",
            "road damage",
            "road damaged",
            "road crack",
            "broken road",
            "pit"
        ]

        if any(keyword in text for keyword in pothole_keywords):
            analysis.update({
                "complaint_type": "Pothole",
                "category": "Road",
                "department": "Road Construction Department",
                "confidence": 0.95,
                "missing_fields": [
                    "district",
                    "location"
                ],
                "needs_clarification": True,
                "next_action": "collect_missing_information"
            })

            return analysis

        # ----------------------------
        # Garbage
        # ----------------------------

        garbage_keywords = [
            "garbage",
            "waste",
            "trash",
            "dustbin",
            "dirty",
            "cleaning"
        ]

        if any(keyword in text for keyword in garbage_keywords):
            analysis.update({
                "complaint_type": "Garbage Collection",
                "category": "Sanitation",
                "department": "Municipal Corporation",
                "confidence": 0.95,
                "missing_fields": [
                    "district",
                    "location"
                ],
                "needs_clarification": True,
                "next_action": "collect_missing_information"
            })

            return analysis

        # ----------------------------
        # Street Light
        # ----------------------------

        light_keywords = [
            "street light",
            "light not working",
            "electric pole",
            "streetlamp"
        ]

        if any(keyword in text for keyword in light_keywords):
            analysis.update({
                "complaint_type": "Street Light",
                "category": "Electricity",
                "department": "Electricity Department",
                "confidence": 0.95,
                "missing_fields": [
                    "district",
                    "location"
                ],
                "needs_clarification": True,
                "next_action": "collect_missing_information"
            })

            return analysis

        # ----------------------------
        # Unknown Complaint
        # ----------------------------

        analysis.update({
            "confidence": 0.20,
            "needs_clarification": True,
            "next_action": "ask_for_more_details"
        })

        return analysis