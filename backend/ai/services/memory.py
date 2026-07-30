# ai/services/memory.py
from typing import Any

class MemoryManager:
    """
    In-memory multi-turn conversational session storage manager.
    Tracks user session state, extracted entities, and decision progress.
    """

    _sessions: dict[str, dict[str, Any]] = {}

    def get_session(self, session_id: str) -> dict:
        """
        Retrieves the session by ID. If not found, initializes it with standard schema.
        """
        if session_id not in self._sessions:
            self._sessions[session_id] = {
                "intent": None,
                "complaint_type": None,
                "category": None,
                "department": None,
                "entities": {
                    "state": None,
                    "district": None,
                    "city": None,
                    "landmark": None,
                    "address": None
                },
                "confidence": 0.0,
                "missing_fields": [],
                "next_action": None,
                "confirmed": False
            }
        return self._sessions[session_id]

    def update_session(self, session_id: str, **kwargs):
        """
        Updates session variables, merging entities to avoid overwriting existing data.
        """
        session = self.get_session(session_id)

        # Merge nested entities dictionary
        if "entities" in kwargs and isinstance(kwargs["entities"], dict):
            for k, v in kwargs["entities"].items():
                if v is not None:
                    session["entities"][k] = v

        # Merge other keys
        for k, v in kwargs.items():
            if k != "entities":
                session[k] = v

        self._sessions[session_id] = session

    def get_value(self, session_id: str, key: str) -> Any:
        """
        Get a specific value from the session dict.
        """
        session = self.get_session(session_id)
        return session.get(key)

    def clear_session(self, session_id: str):
        """
        Removes all data associated with the session.
        """
        self._sessions.pop(session_id, None)