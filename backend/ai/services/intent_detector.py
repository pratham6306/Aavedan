from enum import Enum #It is used when a variable can only take one of a predefined set of limited values.


class Intent(Enum):
    COMPLAINT = "complaint"
    SCHEME_QUERY = "scheme_query"
    SERVICE_QUERY = "service_query"
    GREETING = "greeting"
    HELP = "help"
    THANKS = "thanks"
    GOODBYE = "goodbye"
    UNKNOWN = "unknown"


class IntentDetector:
    """
    Version 1:
    Rule-based intent detection.

    Future versions can replace this with:
    - Sentence Transformers
    - BERT
    - Gemini
    - GPT
    without changing the orchestrator.
    """

    COMPLAINT_KEYWORDS = [
        "complaint",
        "road",
        "pothole",
        "street",
        "water",
        "drain",
        "drainage",
        "garbage",
        "waste",
        "electricity",
        "power",
        "transformer",
        "street light",
        "light",
        "hospital",
        "sewer",
        "broken",
        "damaged",
        "damage",
        "not working",
        "issue",
        "problem",
        "pollution",
        "leakage",
    ]

    SCHEME_KEYWORDS = [
        "scheme",
        "schemes",
        "scholarship",
        "yojana",
        "benefit",
        "benefits",
        "subsidy",
        "farmer",
        "student scheme",
        "government scheme",
    ]

    SERVICE_KEYWORDS = [
        "birth certificate",
        "death certificate",
        "income certificate",
        "caste certificate",
        "residence certificate",
        "passport",
        "driving license",
        "aadhaar",
        "aadhar",
        "pan card",
        "ration card",
        "apply",
        "application",
        "renew",
    ]

    GREETING_KEYWORDS = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
    ]

    HELP_KEYWORDS = [
        "help",
        "what can you do",
        "how does this work",
        "support",
    ]

    THANKS_KEYWORDS = [
        "thanks",
        "thank you",
        "thx",
    ]

    GOODBYE_KEYWORDS = [
        "bye",
        "goodbye",
        "see you",
        "exit",
    ]

    def detect(self, message: str) -> Intent:
        """
        Detect the user's intent from the message.
        """

        message = message.lower().strip()

        # Greeting
        if self._contains_keyword(message, self.GREETING_KEYWORDS):
            return Intent.GREETING

        # Thanks
        if self._contains_keyword(message, self.THANKS_KEYWORDS):
            return Intent.THANKS

        # Goodbye
        if self._contains_keyword(message, self.GOODBYE_KEYWORDS):
            return Intent.GOODBYE

        # Help
        if self._contains_keyword(message, self.HELP_KEYWORDS):
            return Intent.HELP

        # Scheme Query
        if self._contains_keyword(message, self.SCHEME_KEYWORDS):
            return Intent.SCHEME_QUERY

        # Service Query
        if self._contains_keyword(message, self.SERVICE_KEYWORDS):
            return Intent.SERVICE_QUERY

        # Complaint
        if self._contains_keyword(message, self.COMPLAINT_KEYWORDS):
            return Intent.COMPLAINT

        return Intent.UNKNOWN

    @staticmethod
    def _contains_keyword(message: str, keywords: list[str]) -> bool:
        """
        Returns True if any keyword exists in the message.
        """
        return any(keyword in message for keyword in keywords)