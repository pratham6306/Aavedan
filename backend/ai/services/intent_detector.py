# ai/services/intent_detector.py
import re
from ai.constants import Intent

class IntentDetector:
    """
    Rule-based intent detection engine for e-Governance query processing.
    """

    GREETING_PATTERNS = [
        r"\bhi\b", r"\bhello\b", r"\bhey\b", r"\bgreetings\b",
        r"\bgood\s+morning\b", r"\bgood\s+afternoon\b", r"\bgood\s+evening\b"
    ]

    GOODBYE_PATTERNS = [
        r"\bbye\b", r"\bgoodbye\b", r"\bexit\b", r"\bquit\b", r"\bsee\s+you\b"
    ]

    HELP_PATTERNS = [
        r"\bhelp\b", r"\bsupport\b", r"\bhow\s+does\s+this\s+work\b",
        r"\bwhat\s+can\s+you\s+do\b", r"\bfeatures\b", r"\bmenu\b"
    ]

    CONFIRM_PATTERNS = [
        r"\byes\b", r"\byeah\b", r"\byup\b", r"\bok\b", r"\bokay\b",
        r"\bconfirm\b", r"\bproceed\b", r"\bgo\s+ahead\b", r"\bsure\b",
        r"\bcorrect\b"
    ]

    TRACK_PATTERNS = [
        r"\btrack\b", r"\bstatus\b", r"\bcheck\s+complaint\b",
        r"\bwhere\s+is\s+my\s+complaint\b", r"\bcomplaint\s+status\b",
        r"\breference\s+number\b", r"\bgc-\d{4}-\d+"
    ]

    SCHEME_PATTERNS = [
        r"\bscheme\b", r"\bschemes\b", r"\byojana\b", r"\byojna\b", r"\byojanas\b", r"\byojnas\b",
        r"\bscholarship\b", r"\bscholarships\b", r"\bscholorship\b", r"\bscholorships\b",
        r"\bbenefit\b", r"\bbenefits\b", r"\bsubsidy\b", r"\bwelfare\b"
    ]

    OFFICE_PATTERNS = [
        r"\boffice\b", r"\boffices\b", r"\bwhere\s+is\s+(the\s+)?office\b",
        r"\bcontact\s+office\b", r"\boffice\s+address\b", r"\bdepartment\s+office\b"
    ]

    # Common complaint verbs/actions or general terms that indicate complaint intent
    COMPLAINT_PATTERNS = [
        r"\bcomplaint\b", r"\bcomplain\b", r"\breport\b", r"\bissue\b",
        r"\bproblem\b", r"\bfault\b", r"\bbroken\b", r"\bleakage\b",
        r"\bpothole\b", r"\bgarbage\b", r"\bdrain\b", r"\bpower\b",
        r"\belectricity\b", r"\bparking\b", r"\bpollution\b", r"\btree\b",
        r"\btoilet\b", r"\bconstruction\b"
    ]

    def detect(self, message: str) -> Intent:
        """
        Detects the intent of a preprocessed user message.
        """
        text = message.lower().strip()
        if not text:
            return Intent.UNKNOWN

        # Track Complaint (higher priority because reference codes look specific)
        if any(re.search(pattern, text) for pattern in self.TRACK_PATTERNS):
            return Intent.TRACK_COMPLAINT

        # Confirm
        if any(re.search(pattern, text) for pattern in self.CONFIRM_PATTERNS):
            return Intent.CONFIRM

        # Greetings
        if any(re.search(pattern, text) for pattern in self.GREETING_PATTERNS):
            return Intent.GREETING

        # Goodbye
        if any(re.search(pattern, text) for pattern in self.GOODBYE_PATTERNS):
            return Intent.GOODBYE

        # Help
        if any(re.search(pattern, text) for pattern in self.HELP_PATTERNS):
            if "official grievance" not in text:
                return Intent.HELP

        # Scheme Query
        if any(re.search(pattern, text) for pattern in self.SCHEME_PATTERNS):
            return Intent.SEARCH_SCHEME

        # Office Lookup
        if any(re.search(pattern, text) for pattern in self.OFFICE_PATTERNS):
            return Intent.OFFICE_LOOKUP

        # File Complaint
        if any(re.search(pattern, text) for pattern in self.COMPLAINT_PATTERNS):
            return Intent.FILE_COMPLAINT

        # Default to General Query instead of Unknown to handle custom conversational flows
        return Intent.GENERAL_QUERY