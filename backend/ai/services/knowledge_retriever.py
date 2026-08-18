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

        # Handle common typos and variations for robust offline matching
        norm_text = preprocessed_text.lower()
        
        # 1. Map Devanagari Hindi & Indic keywords to English concepts for fallback matching
        hindi_map = {
            r"ट्रांसफार्मर": "transformer electricity power",
            r"बिजली": "electricity power light",
            r"कचरा": "garbage waste sanitation",
            r"पानी": "water supply pipe leakage",
            r"सड़क": "road pothole street",
            r"नाली": "drainage sewer blockage",
            r"लाइट": "street light electricity",
            r"गंदगी": "garbage cleanliness sanitation",
            r"गड्ढा": "pothole road damage",
            r"कटौती": "power outage electricity",
            r"जल": "water supply",
            r"सीवर": "sewage drain",
        }
        for pattern, replacement in hindi_map.items():
            norm_text = re.sub(pattern, replacement, norm_text)

        # 2. Match granular sub-issues across 10 municipal sectors
        sub_issue_rules = [
            # ⚡ Electricity
            (r"transformer|transfomer|sparking|high voltage|overload", "Transformer Sparking & High Voltage Hazard", "Electricity", "Electricity Distribution Department", "CRITICAL", 85000.00),
            (r"street light|streetlights|streetlight|pole light|darkness|street lamp", "Faulty Street Lights & Night Darkness", "Electricity", "Electricity Distribution Department", "HIGH", 25000.00),
            (r"house|meter|no power|no electricity|supply|power outage|power cut", "Household Power Supply Outage", "Electricity", "Electricity Distribution Department", "HIGH", 15000.00),
            (r"wire broken|hanging wire|overhead wire|live wire|exposed wire", "Overhead Power Wire & Live Wire Hazard", "Electricity", "Electricity Distribution Department", "CRITICAL", 35000.00),
            (r"fallen pole|leaning pole|damaged pole|electric pole", "Damaged & Fallen Electric Pole Hazard", "Electricity", "Electricity Distribution Department", "CRITICAL", 45000.00),
            (r"illegal connection|unsafe connection", "Illegal & Unsafe Electrical Connection", "Electricity", "Electricity Distribution Department", "MEDIUM", 20000.00),

            # 🛣️ Roads & Infrastructure
            (r"pothole|pit|hole|crater|road crack|surface crack", "Pothole & Severe Road Surface Damage", "Road & Infrastructure", "Public Works Department (PWD)", "HIGH", 45000.00),
            (r"highway|tar|asphalt|reconstruction|resurfacing|sinkhole|cave-in", "Main Road & Sinkhole Reconstruction Required", "Road & Infrastructure", "Public Works Department (PWD)", "HIGH", 250000.00),
            (r"footpath|sidewalk|pavement|road divider|divider", "Damaged Footpath & Road Divider", "Road & Infrastructure", "Public Works Department (PWD)", "MEDIUM", 30000.00),
            (r"road sign|missing sign|faded marking|zebra crossing|speed breaker", "Road Signages, Markings & Speed Breaker Hazard", "Road & Infrastructure", "Public Works Department (PWD)", "MEDIUM", 20000.00),
            (r"traffic signal|signal not working", "Traffic Signal Failure & Malfunction", "Road & Infrastructure", "Public Works Department (PWD)", "HIGH", 40000.00),

            # 💧 Water Supply
            (r"pipe leakage|water pipe|pipeline burst|broken pipeline", "Water Pipeline Leakage & Burst", "Water Supply", "Water Supply & Sewerage Board", "HIGH", 35000.00),
            (r"contaminated|dirty water|smell|impure water", "Contaminated & Dirty Water Supply", "Water Supply", "Water Supply & Sewerage Board", "CRITICAL", 50000.00),
            (r"no water|water not coming|low pressure|water tanker", "Low Water Pressure & Supply Outage", "Water Supply", "Water Supply & Sewerage Board", "HIGH", 25000.00),
            (r"water tank|public tap|tap not working", "Damaged Public Tap & Water Tank", "Water Supply", "Water Supply & Sewerage Board", "MEDIUM", 20000.00),

            # 🌊 Drainage & Sewerage
            (r"manhole|uncovered manhole|gutter cover|drain cover", "Open Uncovered Manhole Hazard", "Drainage & Sewerage", "Drainage & Sewerage Board", "CRITICAL", 40000.00),
            (r"sewage|sewer|overflow|blocked drain|stormwater", "Overflowing Sewerage Line & Storm Drain Blockage", "Drainage & Sewerage", "Drainage & Sewerage Board", "HIGH", 75000.00),
            (r"waterlogging|water logging|rain waterlog", "Severe Waterlogging After Rain", "Drainage & Sewerage", "Drainage & Sewerage Board", "HIGH", 60000.00),

            # 🗑️ Sanitation & Waste
            (r"dead animal|carcass", "Dead Animal Removal Required", "Sanitation & Waste", "Public Health & Sanitation Department", "HIGH", 15000.00),
            (r"public toilet|urinal", "Unsanitary & Unmaintained Public Toilet", "Sanitation & Waste", "Public Health & Sanitation Department", "MEDIUM", 30000.00),
            (r"garbage|trash|dump|waste|dustbin|construction waste", "Uncleared Waste Dump & Illegal Garbage Dumping", "Sanitation & Waste", "Public Health & Sanitation Department", "MEDIUM", 25000.00),

            # 🌳 Parks & Public Spaces
            (r"park|garden|bench|tree|fallen tree|walking track", "Park Maintenance & Fallen Tree Clearance", "Public Safety", "Municipal Corporation", "MEDIUM", 25000.00),

            # 🚦 Traffic & Public Safety
            (r"cctv|camera|barricade|illegal parking|dangerous junction", "Public Safety, CCTV & Barrier Issue", "Public Safety", "Police Department", "HIGH", 35000.00),

            # 🚌 Public Transport
            (r"bus stop|bus shelter|transport sign", "Damaged Bus Stop & Transit Shelter", "Public Infrastructure", "Transport Department", "MEDIUM", 30000.00),

            # 🏗️ Public Infrastructure
            (r"staircase|community hall|handrail|ramp|government building", "Damaged Public Building & Ramp Access", "Public Infrastructure", "Public Works Department (PWD)", "MEDIUM", 50000.00),

            # 🌫️ Environment
            (r"air pollution|dust|noise|burning garbage|illegal tree cutting", "Environmental Pollution & Nuisance Complaint", "Public Safety", "Pollution Control Board", "MEDIUM", 20000.00),
        ]

        matched_sub = None
        for pattern, title, cat, dept, prio, cost in sub_issue_rules:
            if re.search(pattern, norm_text, re.IGNORECASE):
                matched_sub = (title, cat, dept, prio, cost)
                break

        typo_map = {
            r"\brod\b": "road",
            r"\bblock\b": "blocked",
            r"\bhavy\b": "heavy",
            r"\bcreting\b": "creating",
            r"\bsttudy\b": "study",
            r"\bschlorshipp\b": "scholarship",
        }
        for pattern, replacement in typo_map.items():
            norm_text = re.sub(pattern, replacement, norm_text)

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
                kw_str = kw.keyword.lower().strip()
                pattern = r"\b" + re.escape(kw_str) + r"\b"
                if re.search(pattern, preprocessed_text):
                    score += kw.weight
                    matched_kws.append(kw.keyword)
                else:
                    kw_words = kw_str.split()
                    if len(kw_words) > 1:
                        if all(re.search(r"\b" + re.escape(w) + r"\b", norm_text) for w in kw_words):
                            score += kw.weight * 0.8
                            matched_kws.append(kw.keyword)
            
            if score > best_score:
                best_score = score
                best_match = ct
                best_matched_keywords = matched_kws

        if not best_match:
            if matched_sub:
                title, cat, dept, prio, cost = matched_sub
                return {
                    "complaint_type": title,
                    "category": cat,
                    "department": dept,
                    "priority": prio,
                    "estimated_resolution_days": 5,
                    "estimated_cost": cost,
                    "required_fields": [],
                    "matching_keywords": [title],
                    "confidence_score": 0.90
                }
            return default_result

        confidence = 0.0
        if best_score >= 1.5:
            confidence = 0.95
        elif best_score >= 1.0:
            confidence = 0.85
        elif best_score >= 0.5:
            confidence = 0.70
        else:
            confidence = 0.50

        req_fields = []
        for rf in best_match.required_fields.all():
            req_fields.append({
                "field_name": rf.field_name,
                "display_name": rf.display_name,
                "is_required": rf.is_required
            })

        final_title = matched_sub[0] if matched_sub else best_match.name
        final_cat = matched_sub[1] if matched_sub else (best_match.category.name if best_match.category else None)
        final_dept = matched_sub[2] if matched_sub else (best_match.department.name if best_match.department else None)
        final_prio = matched_sub[3] if matched_sub else best_match.priority
        final_cost = matched_sub[4] if matched_sub else 50000.00

        return {
            "complaint_type": final_title,
            "category": final_cat,
            "department": final_dept,
            "priority": final_prio,
            "estimated_resolution_days": best_match.estimated_resolution_days,
            "estimated_cost": final_cost,
            "required_fields": req_fields,
            "matching_keywords": best_matched_keywords,
            "confidence_score": confidence
        }
