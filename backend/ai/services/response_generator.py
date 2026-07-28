# ai/services/response_generator.py

from ai.services.intent_detector import Intent


class ResponseGenerator:

    def generate(self, session: dict, analysis: dict, intent: Intent) -> dict:

        # Greeting
        if intent == Intent.GREETING:
            reply = (
                "👋 Hello! I'm Aavedan Saathi. "
                "How can I help you today?"
            )

        # Complaint
        elif intent == Intent.COMPLAINT:

            if analysis["complaint_type"]:

                reply = (
                    f"I understood that you want to report a "
                    f"{analysis['complaint_type']} complaint."
                )

                if analysis["needs_clarification"]:
                    reply += (
                        " I need some additional information "
                        "before I can proceed."
                    )

            else:

                reply = (
                    "I couldn't identify the complaint type. "
                    "Could you please provide more details?"
                )

        # Scheme
        elif intent == Intent.SCHEME_QUERY:

            reply = (
                "Sure! Tell me which government scheme "
                "you want information about."
            )

        # Service
        elif intent == Intent.SERVICE_QUERY:

            reply = (
                "Please tell me which government service "
                "you need assistance with."
            )

        # Help
        elif intent == Intent.HELP:

            reply = (
                "I can help you with complaints, government "
                "schemes and public services."
            )

        # Thanks
        elif intent == Intent.THANKS:

            reply = "You're welcome!"

        # Goodbye
        elif intent == Intent.GOODBYE:

            reply = "Goodbye! Have a great day."

        # Unknown
        else:

            reply = (
                "I'm sorry, I couldn't understand your request."
            )

        return {
            "reply": reply,
            "intent": intent.value,
            "complaint_type": analysis["complaint_type"],
            "category": analysis["category"],
            "department": analysis["department"],
            "confidence": analysis["confidence"],
            "needs_clarification": analysis["needs_clarification"],
            "missing_fields": analysis["missing_fields"],
            "next_action": analysis["next_action"],
            "memory": session,
        }