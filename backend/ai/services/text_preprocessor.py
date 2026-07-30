# ai/services/text_preprocessor.py
import re

class TextPreprocessor:
    """
    Standardizes user input messages by:
    - Converting to lowercase
    - Replacing punctuation with spaces (preserving hyphens and underscores for reference/context)
    - Normalizing spaces (removing duplicate/redundant spacing)
    - Stripping leading and trailing spaces
    """
    def preprocess(self, text: str) -> str:
        if not text:
            return ""
        
        # 1. Lowercase
        processed = text.lower()
        
        # 2. Normalize punctuation: replace non-alphanumeric (except space, hyphen, underscore) with space
        processed = re.sub(r"[^\w\s\-_]", " ", processed)
        
        # 3. Replace multiple spaces/newlines with a single space and strip
        processed = re.sub(r"\s+", " ", processed).strip()
        
        return processed
