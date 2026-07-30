from django.db.models import Q

from knowledge.models import ComplaintKeyword


class KnowledgeRetriever:
    """
    Retrieves the most relevant ComplaintType
    based on the user's message.
    """

    def retrieve(self, message: str):
        message = message.lower().strip()

        best_match = None
        highest_score = 0

        keywords = (
            ComplaintKeyword.objects
            .select_related(
                "complaint_type",
                "complaint_type__category",
                "complaint_type__department",
            )
            .filter(
                complaint_type__is_active=True
            )
        )

        for keyword in keywords:

            keyword_text = keyword.keyword.lower()

            if keyword_text in message:

                score = keyword.weight

                if score > highest_score:
                    highest_score = score
                    best_match = keyword.complaint_type

        return best_match