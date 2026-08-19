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

        # 2. Match granular sub-issues across 10 municipal sectors (73 RegEx Sub-Issue Rules)
        sub_issue_rules = [
            # ⚡ ELECTRICITY — 9
            (
                r"\b(transformer|transfomer)\b.*\b(spark|sparking|sparks|smoke|fire|high voltage|overload|overloaded)\b|\b(spark|sparking|sparks|high voltage)\b.*\b(transformer|transfomer)\b",
                "Transformer Sparking & High Voltage Hazard",
                "Electricity",
                "Electricity Distribution Department",
                "CRITICAL",
                85000.00
            ),
            (
                r"\b(street light|streetlight|streetlights|streeth light|streethlight|street lamp|pole light|road light)\b|\b(dark|darkness)\b.*\b(road|street|lane|area)\b",
                "Faulty Street Lights & Night Darkness",
                "Electricity",
                "Electricity Distribution Department",
                "HIGH",
                25000.00
            ),
            (
                r"\b(no power|no electricity|power outage|power cut|electricity outage|electricity cut|power supply.*not|electricity supply.*not|current nahi|bijli nahi|bijli nahin)\b",
                "Household Power Supply Outage",
                "Electricity",
                "Electricity Distribution Department",
                "HIGH",
                15000.00
            ),
            (
                r"\b(broken overhead wire|overhead wire.*broken|hanging power wire|fallen power wire|broken electric wire|electric wire.*broken)\b",
                "Broken Overhead Power Wire",
                "Electricity",
                "Electricity Distribution Department",
                "CRITICAL",
                35000.00
            ),
            (
                r"\b(exposed live wire|live wire exposed|bare live wire|exposed electric wire|open live wire|wire.*exposed|wire hanging dangerously)\b",
                "Exposed Live Wire Hazard",
                "Electricity",
                "Electricity Distribution Department",
                "CRITICAL",
                35000.00
            ),
            (
                r"\b(fallen electric pole|electric pole fallen|pole has fallen|pole fell|pole down|electric pole on road)\b",
                "Fallen Electric Pole",
                "Electricity",
                "Electricity Distribution Department",
                "CRITICAL",
                45000.00
            ),
            (
                r"\b(leaning electric pole|leaning pole|damaged electric pole|damaged pole|tilted electric pole|bent electric pole|weak electric pole)\b",
                "Damaged & Leaning Electric Pole",
                "Electricity",
                "Electricity Distribution Department",
                "CRITICAL",
                45000.00
            ),
            (
                r"\b(transformer overload|transformer overloaded|transformer overloading|transformer overloaded frequently|transformer trips|transformer tripping|transformer capacity|load on transformer)\b",
                "Transformer Overloading",
                "Electricity",
                "Electricity Distribution Department",
                "HIGH",
                50000.00
            ),
            (
                r"\b(illegal electricity connection|illegal electric connection|illegal power connection|unsafe electrical connection|unsafe electricity connection|direct electricity connection|power theft connection|electricity theft connection)\b",
                "Illegal & Unsafe Electrical Connection",
                "Electricity",
                "Electricity Distribution Department",
                "MEDIUM",
                20000.00
            ),

            # 🛣️ ROADS — 10
            (
                r"\b(pothole|potholes|road pit|road hole|crater|deep hole in road)\b",
                "Pothole Patch Work",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "HIGH",
                45000.00
            ),
            (
                r"\b(main road reconstruction|road reconstruction|road needs reconstruction|road resurfacing|road needs resurfacing|highway reconstruction|road completely damaged|road rebuilding)\b",
                "Main Road Reconstruction Required",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "HIGH",
                250000.00
            ),
            (
                r"\b(footpath|sidewalk|pavement)\b.*\b(broken|damaged|cracked|destroyed)\b|\b(broken|damaged|cracked)\b.*\b(footpath|sidewalk|pavement)\b",
                "Damaged Footpath & Sidewalk",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                30000.00
            ),
            (
                r"\b(broken road divider|damaged road divider|divider broken|divider damaged|median broken|median damaged)\b",
                "Broken Road Divider",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                30000.00
            ),
            (
                r"\b(road crack|road cracks|surface crack|surface cracks|cracked road|cracks in road|road surface damaged)\b",
                "Road Surface Cracks",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "HIGH",
                45000.00
            ),
            (
                r"\b(sinkhole|sink hole|road cave[- ]?in|road collapsed|road collapse|road caved in|road has sunk|road sinking)\b",
                "Road Cave-in / Sinkhole",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "CRITICAL",
                250000.00
            ),
            (
                r"\b(missing road sign|road sign missing|no road sign|signboard missing|missing signboard|missing sign board|no signboard|damaged signboard|missing traffic sign)\b",
                "Missing Road Sign",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "LOW",
                20000.00
            ),
            (
                r"\b(zebra crossing|zebracrossing|missing zebra crossing|faded zebra crossing|pedestrian crossing|missing pedestrian crossing|no zebra crossing)\b",
                "Missing / Faded Zebra Crossing",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(faded road marking|faded road markings|road marking faded|faded lane marking|lane markings faded|road lines faded)\b",
                "Faded Road Markings",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "LOW",
                20000.00
            ),
            (
                r"\b(broken speed breaker|damaged speed breaker|speed breaker damaged|speed bump damaged|speed hump damaged)\b",
                "Speed Breaker Damage",
                "Road & Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(traffic signal not working|traffic light not working|signal not working|red light not working|traffic signal broken|signal malfunction)\b",
                "Traffic Signal Failure",
                "Public Safety",
                "Traffic Department",
                "HIGH",
                40000.00
            ),

            # 💧 WATER SUPPLY — 8
            (
                r"\b(water pipeline leakage|water pipeline leak|water pipe leakage|water pipe leaking|pipeline burst|water pipeline burst|pipe burst)\b",
                "Water Pipeline Leakage & Burst",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "HIGH",
                35000.00
            ),
            (
                r"\b(contaminated water|dirty water|impure water|polluted drinking water|unsafe drinking water|bad smell.*water|water.*bad smell|water smells)\b",
                "Contaminated & Dirty Water Supply",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "CRITICAL",
                50000.00
            ),
            (
                r"\b(no water|no water supply|water not coming|water supply stopped|water supply not available|paani nahi|pani nahi)\b",
                "No Water Supply",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "HIGH",
                25000.00
            ),
            (
                r"\b(low water pressure|water pressure low|weak water pressure|paani ka pressure kam|pani pressure low)\b",
                "Low Water Pressure",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "HIGH",
                25000.00
            ),
            (
                r"\b(broken water pipeline|water pipeline broken|water pipe broken|pipeline damaged|water pipe damaged)\b",
                "Broken Water Pipeline",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "HIGH",
                35000.00
            ),
            (
                r"\b(damaged water tank|water tank damaged|broken water tank|public water tank damaged|overhead water tank damaged)\b",
                "Damaged Water Tank",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(public tap not working|public tap broken|community tap not working|tap not working|government tap not working)\b",
                "Public Tap Not Working",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "MEDIUM",
                15000.00
            ),
            (
                r"\b(illegal water connection|illegal water line|illegal pipeline connection|unauthorized water connection|water theft connection)\b",
                "Illegal Water Connection",
                "Water Supply",
                "Water Supply & Sewerage Board",
                "MEDIUM",
                20000.00
            ),

            # 🌊 DRAINAGE — 8
            (
                r"\b(open manhole|uncovered manhole|manhole uncovered|manhole open|manhole without cover)\b",
                "Open Uncovered Manhole Hazard",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "CRITICAL",
                40000.00
            ),
            (
                r"\b(sewer blockage|sewer blocked|sewerage blockage|blocked sewer|sewer line blocked|sewer overflow due to blockage)\b",
                "Overflowing Sewerage Line Blockage",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "HIGH",
                75000.00
            ),
            (
                r"\b(blocked stormwater drain|storm water drain blocked|stormwater drain blocked|rain drain blocked|blocked rainwater drain)\b",
                "Blocked Stormwater Drain",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "HIGH",
                60000.00
            ),
            (
                r"\b(broken drain cover|damaged drain cover|drain cover broken|missing drain cover)\b",
                "Broken Drain Cover",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "CRITICAL",
                30000.00
            ),
            (
                r"\b(waterlogging|water logging|water logged|road flooded after rain|rain water accumulation|rainwater accumulation|standing rain water)\b",
                "Waterlogging After Rain",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "HIGH",
                60000.00
            ),
            (
                r"\b(sewage overflow|sewer overflow|sewage spilling|sewage on road|sewage flowing outside|dirty sewage water)\b",
                "Sewage Overflow",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "CRITICAL",
                75000.00
            ),
            (
                r"\b(damaged drainage pipe|broken drainage pipe|drainage pipe broken|drain pipe damaged|drain pipe broken)\b",
                "Damaged Drainage Pipe",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "HIGH",
                50000.00
            ),
            (
                r"\b(open drain|uncovered drain|open nala|open nallah|open drainage|drain open near house|open drain near residential)\b",
                "Open Drain Near Residential Area",
                "Drainage & Sewerage",
                "Drainage & Sewerage Board",
                "CRITICAL",
                40000.00
            ),

            # 🗑️ SANITATION — 8
            (
                r"\b(uncleared garbage|garbage not cleared|waste not cleared|garbage lying for days|garbage pile|garbage dump not removed)\b",
                "Uncleared Waste Dump & Garbage",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                25000.00
            ),
            (
                r"\b(garbage collection not happening|garbage not collected|garbage collection stopped|garbage collector not coming|no garbage collection|waste collection not happening)\b",
                "Garbage Collection Not Happening",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                25000.00
            ),
            (
                r"\b(overflowing dustbin|dustbin overflowing|dustbin full|bin overflowing|garbage bin full|public bin overflowing)\b",
                "Overflowing Dustbin",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                25000.00
            ),
            (
                r"\b(illegal garbage dumping|illegal waste dumping|garbage dumped illegally|people dumping garbage|waste dumped illegally|dumping trash)\b",
                "Illegal Garbage Dumping",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                25000.00
            ),
            (
                r"\b(dead animal|dead dog|dead cow|dead cattle|animal carcass|carcass|dead animal removal)\b",
                "Dead Animal Removal",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "HIGH",
                15000.00
            ),
            (
                r"\b(street dog|street dogs|stray dog|stray dogs|dog menace|stray animal|stray animals|dog bite|dog biting|rabid dog|stray dog nuisance|dogs barking|kutte)\b",
                "Stray Dog Menace & Animal Nuisance",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "HIGH",
                20000.00
            ),
            (
                r"\b(public toilet|public urinal)\b.*\b(dirty|filthy|broken|unclean|not maintained|maintenance|bad condition)\b|\b(dirty|filthy|broken|unclean)\b.*\b(public toilet|public urinal)\b",
                "Public Toilet Not Maintained",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                30000.00
            ),
            (
                r"\b(dirty public area|unclean public area|filthy public place|dirty street|unclean public place|dirty surroundings)\b",
                "Dirty Public Area",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(construction waste|building debris|construction debris|cement debris|construction material dumped|rubble dumped)\b",
                "Construction Waste Dumping",
                "Sanitation & Waste",
                "Public Health & Sanitation Department",
                "MEDIUM",
                30000.00
            ),

            # 🌳 PARKS & PUBLIC SPACES — 7
            (
                r"\b(playground equipment|park equipment|swings|slide|children equipment)\b.*\b(broken|damaged|unsafe|broken down)\b|\b(broken|damaged|unsafe)\b.*\b(playground equipment|park equipment|swings|slide)\b",
                "Damaged Park Equipment",
                "Public Safety",
                "Municipal Corporation",
                "MEDIUM",
                25000.00
            ),
            (
                r"\b(broken park bench|damaged park bench|bench broken|bench damaged|park bench unsafe)\b",
                "Broken Benches",
                "Public Safety",
                "Municipal Corporation",
                "LOW",
                15000.00
            ),
            (
                r"\b(park light|park lighting|park lights|garden light)\b.*\b(not working|broken|failed|dark)\b|\b(not working|broken|failed)\b.*\b(park light|park lighting|park lights)\b",
                "Park Lighting Failure",
                "Public Safety",
                "Municipal Corporation",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(unmaintained park|park not maintained|neglected park|unclean park|overgrown park|unmaintained garden|garden not maintained)\b",
                "Unmaintained Park/Garden",
                "Public Safety",
                "Municipal Corporation",
                "MEDIUM",
                25000.00
            ),
            (
                r"\b(fallen tree|dangerous tree|tree may fall|tree about to fall|tree fallen|tree blocking road|dead tree)\b",
                "Fallen/Dangerous Tree",
                "Public Safety",
                "Municipal Corporation",
                "HIGH",
                30000.00
            ),
            (
                r"\b(encroachment|encroached|illegal occupation|public land occupied|park encroachment|public space encroachment|footpath encroachment)\b",
                "Encroachment on Public Space",
                "Public Safety",
                "Municipal Corporation",
                "HIGH",
                50000.00
            ),
            (
                r"\b(walking track|walking path|jogging track|jogging path)\b.*\b(broken|damaged|cracked|unsafe)\b|\b(broken|damaged|cracked|unsafe)\b.*\b(walking track|jogging track)\b",
                "Damaged Walking Track",
                "Public Safety",
                "Municipal Corporation",
                "MEDIUM",
                25000.00
            ),

            # 🚦 TRAFFIC & PUBLIC SAFETY — 6
            (
                r"\b(missing street sign|street sign missing|street name sign missing|no street sign|street name board missing)\b",
                "Missing Street Sign",
                "Public Safety",
                "Traffic Department",
                "LOW",
                15000.00
            ),
            (
                r"\b(illegal parking|wrong parking|parked illegally|vehicles parked illegally|car parked blocking road|vehicle blocking road)\b",
                "Illegal Parking",
                "Public Safety",
                "Traffic Police Department",
                "HIGH",
                10000.00
            ),
            (
                r"\b(damaged road barricade|broken road barricade|barricade broken|barricade damaged|safety barricade broken)\b",
                "Damaged Road Barricade",
                "Public Safety",
                "Traffic Department",
                "HIGH",
                25000.00
            ),
            (
                r"\b(zebra crossing blocked|blocked zebra crossing|zebra crossing missing|no zebra crossing|zebra crossing faded|crosswalk blocked)\b",
                "Missing/Blocked Zebra Crossing",
                "Public Safety",
                "Traffic Department",
                "HIGH",
                20000.00
            ),
            (
                r"\b(broken cctv|cctv not working|cctv camera broken|camera not working|surveillance camera broken|security camera not working)\b",
                "Broken CCTV Camera",
                "Public Safety",
                "Police Department",
                "HIGH",
                35000.00
            ),
            (
                r"\b(dangerous road junction|dangerous junction|accident prone junction|accident[- ]prone area|unsafe road junction|dangerous intersection)\b",
                "Dangerous Road Junction",
                "Public Safety",
                "Traffic Department",
                "HIGH",
                50000.00
            ),

            # 🚌 PUBLIC TRANSPORT — 5
            (
                r"\b(damaged bus stop|bus stop damaged|broken bus stop)\b",
                "Damaged Bus Stop",
                "Public Infrastructure",
                "Transport Department",
                "MEDIUM",
                30000.00
            ),
            (
                r"\b(bus stop light|bus stop lighting|bus shelter light)\b.*\b(not working|broken|dark|failed)\b|\b(not working|broken|dark|failed)\b.*\b(bus stop light|bus stop lighting)\b",
                "Bus Stop Lighting Failure",
                "Public Infrastructure",
                "Transport Department",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(missing bus shelter|no bus shelter|bus shelter missing|bus stop has no shelter)\b",
                "Missing Bus Shelter",
                "Public Infrastructure",
                "Transport Department",
                "MEDIUM",
                50000.00
            ),
            (
                r"\b(damaged public transport sign|damaged bus sign|bus sign broken|transport sign damaged|bus stop sign damaged)\b",
                "Damaged Public Transport Sign",
                "Public Infrastructure",
                "Transport Department",
                "LOW",
                15000.00
            ),
            (
                r"\b(unsafe bus stop|blocked bus stop|bus stop blocked|bus stop inaccessible|bus stop occupied|bus stop dangerous)\b",
                "Unsafe/Blocked Bus Stop",
                "Public Infrastructure",
                "Transport Department",
                "HIGH",
                25000.00
            ),

            # 🏗️ PUBLIC INFRASTRUCTURE — 6
            (
                r"\b(damaged government building|government building damaged|government office damaged|govt building damaged)\b",
                "Damaged Government Building",
                "Public Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                50000.00
            ),
            (
                r"\b(broken public staircase|public staircase damaged|stairs broken|government staircase broken|staircase damaged)\b",
                "Broken Public Staircase",
                "Public Infrastructure",
                "Public Works Department (PWD)",
                "HIGH",
                35000.00
            ),
            (
                r"\b(damaged community hall|community hall damaged|community center damaged|community centre damaged)\b",
                "Damaged Community Hall",
                "Public Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                50000.00
            ),
            (
                r"\b(broken handrail|damaged handrail|public handrail broken|stair handrail broken|railing broken)\b",
                "Broken Public Handrail",
                "Public Infrastructure",
                "Public Works Department (PWD)",
                "HIGH",
                25000.00
            ),
            (
                r"\b(ramp damaged|broken ramp|accessibility ramp|disabled ramp|wheelchair ramp damaged|wheelchair access broken)\b",
                "Accessibility/Ramp Damage",
                "Public Infrastructure",
                "Public Works Department (PWD)",
                "HIGH",
                30000.00
            ),
            (
                r"\b(damaged public property|public property damaged|government property damaged|public asset damaged|municipal property damaged)\b",
                "Damaged Public Property",
                "Public Infrastructure",
                "Public Works Department (PWD)",
                "MEDIUM",
                30000.00
            ),

            # 🌫️ ENVIRONMENT — 7
            (
                r"\b(air pollution|air quality|smoke pollution|polluted air|toxic smoke|harmful smoke)\b",
                "Air Pollution Complaint",
                "Public Safety",
                "Pollution Control Board",
                "HIGH",
                30000.00
            ),
            (
                r"\b(construction dust|dust from construction|construction site dust|building dust|excessive construction dust)\b",
                "Excessive Dust from Construction",
                "Public Safety",
                "Pollution Control Board",
                "LOW",
                20000.00
            ),
            (
                r"\b(noise pollution|loud noise|excessive noise|very loud sound|loudspeaker noise|construction noise)\b",
                "Noise Pollution",
                "Public Safety",
                "Pollution Control Board",
                "MEDIUM",
                20000.00
            ),
            (
                r"\b(burning garbage|garbage burning|burning waste|waste burning|burning trash|garbage being burned)\b",
                "Burning of Garbage",
                "Public Safety",
                "Pollution Control Board",
                "HIGH",
                20000.00
            ),
            (
                r"\b(illegal tree cutting|illegal tree felling|tree cutting illegally|trees being cut illegally|unauthorized tree cutting)\b",
                "Illegal Tree Cutting",
                "Public Safety",
                "Pollution Control Board",
                "HIGH",
                25000.00
            ),
            (
                r"\b(water pollution|polluted river|polluted lake|polluted pond|water body polluted|industrial pollution in water|dirty river|chemical waste in water)\b",
                "Water Pollution",
                "Public Safety",
                "Pollution Control Board",
                "CRITICAL",
                50000.00
            ),
            (
                r"\b(industrial waste|factory waste|factory dumping waste|industrial waste disposal|chemical waste disposal|factory waste dumped|industrial effluent)\b",
                "Industrial Waste Disposal",
                "Public Safety",
                "Pollution Control Board",
                "CRITICAL",
                75000.00
            ),
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
