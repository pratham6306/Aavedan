# ai/services/location_extractor.py
import re
from locations.models import State, District

class LocationExtractor:
    """
    Rule-based extraction of location elements (state, district, landmark, address, city).
    Features database-driven lookups and context-aware overrides.
    """

    def extract(self, text: str, preprocessed_text: str, awaiting_field: str = None) -> dict:
        """
        Extracts location entities from the user message.
        - text: original user message (preserves capitalization).
        - preprocessed_text: preprocessed lowercase message.
        - awaiting_field: context indicating what location field the system is currently asking for.
        """
        entities = {
            "state": None,
            "district": None,
            "city": None,
            "landmark": None,
            "address": None
        }

        # ----------------------------
        # 1. Context-Aware Extraction
        # ----------------------------
        if awaiting_field:
            field = awaiting_field.lower().strip()
            if field == "state":
                # Check if it matches a state in the DB
                state_obj = State.objects.filter(name__iexact=text.strip()).first()
                if state_obj:
                    entities["state"] = state_obj.name
                else:
                    # Fallback to the raw string if reasonable
                    entities["state"] = text.strip()
                return entities
            
            elif field == "district":
                # Check if it matches a district in the DB
                dist_obj = District.objects.filter(name__iexact=text.strip()).first()
                if dist_obj:
                    entities["district"] = dist_obj.name
                    entities["state"] = dist_obj.state.name
                else:
                    entities["district"] = text.strip()
                return entities
            
            elif field == "address":
                entities["address"] = text.strip()
                # Try to extract district or state from the address if mentioned
                self._extract_db_locations(preprocessed_text, entities)
                return entities

            elif field == "landmark":
                entities["landmark"] = text.strip()
                return entities

        # ----------------------------
        # 2. General Rule-Based Matching
        # ----------------------------
        self._extract_db_locations(preprocessed_text, entities)

        # 3. Extract Landmark using Prepositions
        # e.g., "near KIIT Square", "behind block 4"
        landmark_pattern = r"\b(near|behind|opposite|beside|at|close\s+to)\s+([a-zA-Z0-9\s]+)"
        match = re.search(landmark_pattern, text, re.IGNORECASE)
        if match:
            raw_landmark = match.group(2)
            # Stop at another preposition or comma to get the precise landmark name
            parts = re.split(r"\b(in|on|at|near|behind|opposite|beside|with|of|district|state|city)\b|,", raw_landmark, flags=re.IGNORECASE)
            entities["landmark"] = parts[0].strip()

        # 4. Enforce district-state consistency if both are extracted
        if entities["district"]:
            dist_obj = District.objects.filter(name__iexact=entities["district"]).first()
            if dist_obj:
                entities["state"] = dist_obj.state.name

        return entities

    def _extract_db_locations(self, preprocessed_text: str, entities: dict):
        """
        Helper to scan text for any matches with database-seeded State and District names.
        """
        # Query active states
        states = State.objects.all()
        for state in states:
            pattern = r"\b" + re.escape(state.name.lower()) + r"\b"
            if re.search(pattern, preprocessed_text):
                entities["state"] = state.name
                break

        # Query districts
        districts = District.objects.all()
        for dist in districts:
            pattern = r"\b" + re.escape(dist.name.lower()) + r"\b"
            if re.search(pattern, preprocessed_text):
                entities["district"] = dist.name
                entities["state"] = dist.state.name
                break
