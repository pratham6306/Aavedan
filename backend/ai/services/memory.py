from typing import Any


class MemoryManager:
    """
    Temporary in-memory session storage.

    Future:
    Replace this with Redis or a database without changing
    the orchestrator.
    """

    _sessions: dict[str, dict[str, Any]] = {}

    def get_session(self, session_id: str) -> dict:
        """
        Return session data.
        If the session doesn't exist, create it.
        """
        if session_id not in self._sessions:
            self._sessions[session_id] = {}

        return self._sessions[session_id]

    def update_session(self, session_id: str, **kwargs):

        session = self.get_session(session_id)

        session.update(kwargs)

        self._sessions[session_id] = session

    def get_value(self, session_id: str, key: str):
        """
        Get a single value from the session.
        """
        session = self.get_session(session_id)
        return session.get(key)

    def clear_session(self, session_id: str):
        """
        Remove all session data.
        """
        self._sessions.pop(session_id, None)