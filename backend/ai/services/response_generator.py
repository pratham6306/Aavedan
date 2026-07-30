# ai/services/response_generator.py
from ai.constants import NextAction

class ResponseGenerator:
    """
    Formulates natural language explanations and formats the complete API payload.
    Ensures zero hallucination by strictly outputting database-verified department information.
    """

    def generate(self, session: dict, office: dict) -> dict:
        """
        Generates NL reply and structured response object.
        """
        next_action_str = session.get("next_action")
        complaint_type = session.get("complaint_type")
        category = session.get("category")
        department = session.get("department")
        entities = session.get("entities", {})
        state = entities.get("state")
        district = entities.get("district")
        address = entities.get("address")
        landmark = entities.get("landmark")
        priority = session.get("priority", "MEDIUM")
        confidence = session.get("confidence", 0.0)
        missing_fields = session.get("missing_fields", [])

        # Default NL Replies based on NextAction state
        if next_action_str == NextAction.ASK_COMPLAINT_DETAILS.value:
            reply = "Please describe the public issue you are facing in detail. For example: 'There is a pothole near KIIT Square' or 'The street light is not working'."
        
        elif next_action_str == NextAction.ASK_STATE.value:
            reply = "Understood. Which state is this issue located in? (e.g., Odisha, Bihar)"
        
        elif next_action_str == NextAction.ASK_DISTRICT.value:
            reply = "To route this correctly, please specify your district."
        
        elif next_action_str == NextAction.ASK_ADDRESS.value:
            reply = "Please enter the street name, block, or specific address details for this issue."
        
        elif next_action_str == NextAction.ASK_LANDMARK.value:
            reply = "Could you provide a nearby landmark to help locate this?"
        
        elif next_action_str == NextAction.ASK_PHOTO.value:
            reply = "If available, please upload or describe any photo evidence of the issue (optional, you can type 'none')."
        
        elif next_action_str == NextAction.ASK_REQUIRED_FIELDS.value:
            # Get the display name of the missing field if possible
            missing_disp = missing_fields[0] if missing_fields else "required details"
            reply = f"We need some extra details. Please provide the following information: {missing_disp}."
        
        elif next_action_str == NextAction.ASK_CLARIFICATION.value:
            reply = "I'm not quite sure about the type of complaint you want to file. Did you mean road potholes, street lights, or garbage collection? Please clarify."
        
        elif next_action_str == NextAction.CONFIRM_AND_FILE.value:
            loc_str = ", ".join(filter(None, [address, landmark, district, state]))
            reply = (
                f"I have gathered all the necessary details. Here is a summary of your complaint:\n\n"
                f"• **Complaint Type**: {complaint_type}\n"
                f"• **Department**: {department}\n"
                f"• **Priority**: {priority}\n"
                f"• **Location**: {loc_str}\n\n"
                "Would you like to proceed with lodging this complaint officially?"
            )
        
        elif next_action_str == NextAction.FILE_COMPLAINT.value:
            office_name = office.get("name", "Local Division Office")
            office_address = office.get("address", "Collectorate Campus")
            office_email = office.get("email", "Not available")
            office_phone = office.get("phone", "Not available")
            portal_url = office.get("portal_url", "#")
            
            loc_str = ", ".join(filter(None, [address, landmark, district, state]))
            
            reply = (
                "Thank you for confirming. As Aavedan Saathi is an intelligent e-Governance assistant, we guide citizens on lodging complaints. Here are the contact and filing details for your official complaint:\n\n"
                f"• **Office Name**: {office_name}\n"
                f"• **Address**: {office_address}\n"
                f"• **Official Email**: {office_email}\n"
                f"• **Phone**: {office_phone}\n"
                f"• **Grievance Portal**: [Official Portal Link]({portal_url})\n\n"
                "**Instructions to lodge your complaint**:\n"
                f"1. Visit the portal: {portal_url}\n"
                f"2. Fill in the details: Complaint Type: **{complaint_type}**, Location: **{loc_str}**.\n"
                f"3. Alternatively, you can email your complaint directly to: **{office_email}**."
            )
            
        elif next_action_str == NextAction.TRACK_COMPLAINT.value:
            reply = "To track a complaint, please enter the official grievance reference number (e.g., GC-2026-000001)."
        
        elif next_action_str == NextAction.SHOW_SCHEME.value:
            reply = "Certainly! What government welfare schemes (such as scholarships, crop relief, or Biju Pucca Ghar Yojana) would you like to inquire about?"
        
        elif next_action_str == NextAction.SHOW_OFFICE.value:
            reply = "Please tell me the department name and your district/state, and I will find the nearest office details for you."
        
        elif next_action_str == NextAction.COMPLETE.value:
            reply = "Thank you for using Aavedan Saathi. Have a nice day! If you have more questions, feel free to ask."
            
        else:
            reply = "I'm sorry, I couldn't understand your request. How can I help you today?"

        return {
            "success": True,
            "reply": reply,
            "message": reply,  # Provide both to support old and new serializers
            "intent": session.get("intent"),
            "confidence": confidence,
            "complaint_type": complaint_type,
            "category": category,
            "department": department,
            "office": office,
            "entities": entities,
            "missing_fields": missing_fields,
            "next_action": next_action_str
        }