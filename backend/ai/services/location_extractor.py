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
        # Always run database location scanning first so district/state mentions anywhere in user input are captured!
        self._extract_db_locations(preprocessed_text, entities)

        if awaiting_field:
            # Check if structured 'State: X, District: Y' text was sent
            if "state:" in text.lower() or "district:" in text.lower():
                lines_and_parts = re.split(r"[\n,]+", text)
                for part in lines_and_parts:
                    if "state:" in part.lower():
                        st_val = part.split(":")[1].strip()
                        if st_val:
                            st_obj = State.objects.filter(name__iexact=st_val).first() or State.objects.filter(name__icontains=st_val).first()
                            if st_obj:
                                entities["state"] = st_obj.name
                    elif "district:" in part.lower():
                        dt_val = part.split(":")[1].strip()
                        if dt_val:
                            dt_obj = District.objects.filter(name__iexact=dt_val).first() or District.objects.filter(name__icontains=dt_val).first()
                            if dt_obj:
                                entities["district"] = dt_obj.name
                                if not entities.get("state"):
                                    entities["state"] = dt_obj.state.name
                if entities.get("state") and entities.get("district"):
                    return entities

            field = awaiting_field.lower().strip()
            if field == "state":
                self._extract_db_locations(preprocessed_text, entities)
                if not entities.get("state"):
                    state_obj = State.objects.filter(name__iexact=text.strip()).first() or State.objects.filter(name__icontains=text.strip()).first()
                    if state_obj:
                        entities["state"] = state_obj.name
                return entities
            
            elif field == "district":
                self._extract_db_locations(preprocessed_text, entities)
                if not entities.get("district"):
                    dist_obj = District.objects.filter(name__iexact=text.strip()).first() or District.objects.filter(name__icontains=text.strip()).first()
                    if dist_obj:
                        entities["district"] = dist_obj.name
                        entities["state"] = dist_obj.state.name
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

        # 2b. Explicit or Implicit Address extraction
        if "Address:" in text:
            try:
                addr_val = text.split("Address:")[1]
                for label in ["State:", "District:", "Landmark:", "Category:", "Description:"]:
                    if label in addr_val:
                        addr_val = addr_val.split(label)[0]
                addr_val = addr_val.strip()
                if addr_val:
                    entities["address"] = addr_val
            except Exception:
                pass

        if not entities["address"]:
            # Auto-extract address from street/road/bypass/ward/colony patterns or rich location text
            addr_patterns = r"\b([a-zA-Z0-9\s,\.\-']+\b(?:road|rd|bypass|pass|sh\d*|nh\d*|street|st|colony|nagar|chowk|gali|ward|sector|marg|cross|lane|block|apartment|housing|slum|village)\b[a-zA-Z0-9\s,\.\-']*)"
            match_addr = re.search(addr_patterns, text, re.IGNORECASE)
            if match_addr:
                clean_addr = match_addr.group(1).strip()
                if len(clean_addr) >= 4:
                    entities["address"] = clean_addr
            elif entities.get("district") and len(text.strip().split()) >= 3:
                entities["address"] = text.strip()

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

        # Query districts with exact match first
        districts = District.objects.select_related("state").all()
        for dist in districts:
            pattern = r"\b" + re.escape(dist.name.lower()) + r"\b"
            if re.search(pattern, preprocessed_text):
                entities["district"] = dist.name
                entities["state"] = dist.state.name
                break

        # Fuzzy matching for spelling typos in District names (e.g. madhepurii -> Madhepura, purniya -> Purnia)
        if not entities["district"]:
            import difflib
            stop_words = {"water", "issue", "problem", "complaint", "street", "light", "drain", "road", "help", "near", "behind", "area", "lane", "block", "house", "more", "ghare", "pani", "nhi", "nahi"}
            words = [w for w in preprocessed_text.split() if len(w) >= 4 and w not in stop_words]
            dist_map = {d.name.lower(): d for d in districts}
            dist_names_lower = list(dist_map.keys())
            for word in words:
                close = difflib.get_close_matches(word, dist_names_lower, n=1, cutoff=0.70)
                if close:
                    matched_dist = dist_map[close[0]]
                    entities["district"] = matched_dist.name
                    entities["state"] = matched_dist.state.name
                    break
