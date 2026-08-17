# ai/services/email_dispatcher.py
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from ai.services.office_finder import OfficeFinder

class EmailDispatcher:
    """
    Constructs and sends a formal public grievance email to the verified department office,
    automatically CCing the citizen and setting the Reply-To header.
    """

    def __init__(self):
        self.office_finder = OfficeFinder()

    def send_grievance_email(self, session_data: dict, user_email: str, is_anonymous: bool = False) -> bool:
        """
        Sends the compiled grievance report to the designated officer.
        """
        complaint_type = session_data.get("complaint_type")
        category = session_data.get("category", "General")
        department = session_data.get("department")
        priority = session_data.get("priority", "MEDIUM")
        entities = session_data.get("entities", {})
        
        state = session_data.get("state") or entities.get("state")
        district = session_data.get("district") or entities.get("district")
        address = session_data.get("address") or entities.get("address", "Not provided")
        landmark = session_data.get("landmark") or entities.get("landmark", "Not provided")
        
        # 3-line formal description generator for offline & preview handoffs
        gen_desc = session_data.get("generated_description")
        user_desc = session_data.get("description")
        
        if gen_desc:
            raw_desc = gen_desc
        elif user_desc and user_desc.strip() != address.strip() and len(user_desc.strip()) > 10:
            raw_desc = user_desc
        else:
            line1 = f"Official Grievance Notice regarding {complaint_type or category} reported under {department or 'Municipal Authority'} ({category})."
            line2 = f"Location & Site details: {address}, Landmark: {landmark}, District: {district}, State: {state}."
            line3 = "Public Urgency: Escalated for immediate municipal inspection and resolution dispatch."
            raw_desc = f"{line1}\n{line2}\n{line3}"
        
        # Call AI Microservice to generate a professional draft
        description = raw_desc
        import sys
        if not (len(sys.argv) > 1 and sys.argv[1] == 'test'):
            import requests
            ai_url = getattr(settings, "AI_SERVICE_URL", "http://localhost:8010")
            try:
                category_name = session_data.get("category", "General")
                category_mapping = {
                    "Road & Infrastructure": "ROAD_DAMAGE",
                    "Water Supply": "WATER_SUPPLY",
                    "Electricity": "ELECTRICITY",
                    "Sanitation & Waste": "GARBAGE_COLLECTION",
                    "Drainage & Sewerage": "DRAINAGE",
                    "Public Safety": "PUBLIC_SAFETY",
                }
                category_code = category_mapping.get(category_name, "OTHER")
                payload = {
                    "text": raw_desc,
                    "category_code": category_code,
                    "language": "en"
                }
                res = requests.post(f"{ai_url}/api/v1/complaints/draft", json=payload, timeout=10)
                if res.status_code == 200:
                    draft_data = res.json()
                    description = draft_data.get("draft_text", raw_desc)
            except Exception as e:
                print(f"Warning: Failed to fetch AI draft: {str(e)}")

        if not complaint_type or not department or not state or not district:
            raise ValueError("Incomplete session data: complaint_type, department, state, and district are required.")

        # 1. Retrieve the verified office email
        office_info = self.office_finder.find_office(
            department_name=department,
            district_name=district,
            state_name=state
        )
        recipient_email = office_info.get("email")
        
        # Local testing override: send to pratham6306@gmail.com (and not running unit tests)
        import sys
        if not (len(sys.argv) > 1 and sys.argv[1] == 'test'):
            recipient_email = "pratham6306@gmail.com"
            
        office_name = office_info.get("name", "Department Office")

        # 2. Formulate Subject
        subject = f"[Grievance Registration] {complaint_type} - {district}, {state}"

        # Resolve attachments details for HTML and Text
        evidence_list = ""
        text_attachments = ""
        complaint_id = session_data.get("complaint_id")
        if complaint_id:
            try:
                from complaints.models import Complaint
                complaint_obj = Complaint.objects.get(id=complaint_id)
                images = complaint_obj.images.all()
                if images.exists():
                    import os
                    evidence_list = "<h3 style='color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px;'>Attached Evidence</h3>"
                    evidence_list += "<p style='margin-top: 10px;'>The following evidence photos have been attached to this email dispatch:</p>"
                    evidence_list += "<div style='display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;'>"
                    text_attachments = "ATTACHED EVIDENCE:\n"
                    for img in images:
                        if img.image:
                            img_name = os.path.basename(img.image.name)
                            cid = f"evidence_{img.id}"
                            evidence_list += f"""
                            <div style='border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; background-color: #f9f9f9; padding: 10px; text-align: center; max-width: 180px;'>
                                <img src='cid:{cid}' style='max-width: 100%; max-height: 120px; object-fit: contain; border-radius: 4px;' alt='{img_name}' />
                                <p style='margin: 5px 0 0 0; font-size: 10px; color: #777777; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'>{img_name}</p>
                            </div>
                            """
                            text_attachments += f"- {img_name}\n"
                    evidence_list += "</div>"
                    text_attachments += "\n"
            except Exception:
                pass

        citizen_contact_text = (
            "CITIZEN CONTACT INFORMATION:\n• Email: Anonymous Citizen (Contact details hidden for privacy)\n\n"
            if is_anonymous else
            f"CITIZEN CONTACT INFORMATION:\n• Email: {user_email}\n\n"
        )

        citizen_contact_html = (
            "<p style='margin-top: 10px;'>This report has been registered under: <strong>Anonymous Citizen (Protected for privacy)</strong>.</p>"
            if is_anonymous else
            f"<p style='margin-top: 10px;'>This report has been registered under: <strong>{user_email}</strong>. For any follow-up, you can reply directly to this email or contact the sender.</p>"
        )

        # 3. Formulate Plain Text Body
        text_content = (
            f"Dear Sir/Madam,\n\n"
            f"Subject: Grievance regarding {complaint_type} in {district}\n\n"
            f"This is to bring to your official notice a public grievance compiled by a citizen via the Aavedan Saathi platform. The details of the issue are listed below:\n\n"
            f"--------------------------------------------------\n"
            f"GRIEVANCE DETAILS:\n"
            f"--------------------------------------------------\n"
            f"• Department: {department}\n"
            f"• Category: {category}\n"
            f"• Complaint Type: {complaint_type}\n"
            f"• Priority/Urgency: {priority}\n"
            f"• Description: {description}\n\n"
            f"LOCATION DETAILS:\n"
            f"• Specific Address: {address}\n"
            f"• Nearby Landmark: {landmark}\n"
            f"• District: {district}\n"
            f"• State: {state}\n\n"
            f"{text_attachments}"
            f"{citizen_contact_text}"
            f"Please review the details and initiate corrective action at the earliest.\n\n"
            f"Sincerely,\n"
            f"Aavedan Saathi Grievance Assistant\n"
        )

        # 4. Formulate HTML Styled Body (with Premium Aesthetics)
        html_content = f"""
        <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; color: #333333; line-height: 1.6; background-color: #f9f9f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #1e3a8a; padding: 20px; color: #ffffff; text-align: center;">
                    <h2 style="margin: 0; font-size: 22px;">Aavedan Saathi</h2>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Official Public Grievance Dispatch</p>
                </div>
                <div style="padding: 25px;">
                    <p style="font-size: 16px;">Dear Sir/Madam,</p>
                    <p>A public grievance has been compiled by a citizen using <strong>Aavedan Saathi</strong> and directed to your division. Please review the details below:</p>
                    
                    <h3 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px;">Issue Details</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Department:</td>
                            <td style="padding: 8px 0;">{department}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Office Name:</td>
                            <td style="padding: 8px 0;">{office_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Complaint Type:</td>
                            <td style="padding: 8px 0;"><span style="background-color: #eff6ff; color: #1e3a8a; padding: 2px 8px; border-radius: 4px; font-weight: 500;">{complaint_type}</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Category:</td>
                            <td style="padding: 8px 0;">{category}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Priority:</td>
                            <td style="padding: 8px 0;"><span style="background-color: #fffaf0; color: #dd6b20; padding: 2px 8px; border-radius: 4px; font-weight: 500;">{priority}</span></td>
                        </tr>
                    </table>
                    
                    <h3 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px;">Description</h3>
                    <div style="background-color: #f3f4f6; border-left: 4px solid #1e3a8a; padding: 15px; margin-top: 10px; border-radius: 0 4px 4px 0; font-style: italic;">
                        {description}
                    </div>
                    
                    <h3 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px;">Location Details</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Address:</td>
                            <td style="padding: 8px 0;">{address}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Landmark:</td>
                            <td style="padding: 8px 0;">{landmark}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">District:</td>
                            <td style="padding: 8px 0;">{district}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">State:</td>
                            <td style="padding: 8px 0;">{state}</td>
                        </tr>
                    </table>
                    
                    {evidence_list}
                    
                    <h3 style="color: #1e3a8a; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px;">Citizen Contact Info</h3>
                    {citizen_contact_html}
                </div>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #e0e0e0;">
                    This is an automated dispatch from the Aavedan Saathi Assistant on behalf of the citizen.
                </div>
            </div>
        </body>
        </html>
        """

        # 5. Build Django Email Message
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@aavedan-saathi.gov.in")
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient_email],
            cc=[] if is_anonymous else [user_email],
            bcc=[user_email] if is_anonymous else [],
            reply_to=[from_email] if is_anonymous else [user_email]
        )
        email.attach_alternative(html_content, "text/html")

        # 6. Query and attach images/photos if it is linked to a database complaint
        complaint_id = session_data.get("complaint_id")
        if complaint_id:
            try:
                from complaints.models import Complaint
                complaint_obj = Complaint.objects.get(id=complaint_id)
                for img in complaint_obj.images.all():
                    if img.image:
                        import os
                        from email.mime.image import MIMEImage
                        img_name = os.path.basename(img.image.name)
                        # Open and read file bytes
                        img.image.open()
                        content = img.image.read()
                        
                        # Create MIMEImage inline attachment mapped to CID
                        mime_image = MIMEImage(content)
                        mime_image.add_header('Content-ID', f'<evidence_{img.id}>')
                        mime_image.add_header('Content-Disposition', 'inline', filename=img_name)
                        email.attach(mime_image)
            except Exception as img_err:
                print(f"Warning: Failed to attach complaint image inline: {str(img_err)}")

        # 7. Send the email
        email.send()
        return True

    def get_email_preview(self, session_data: dict, user_email: str, is_anonymous: bool = False) -> dict:
        """
        Constructs and returns the email headers and body preview without sending it.
        """
        complaint_type = session_data.get("complaint_type")
        category = session_data.get("category", "General")
        department = session_data.get("department")
        priority = session_data.get("priority", "MEDIUM")
        entities = session_data.get("entities", {})
        
        state = session_data.get("state") or entities.get("state")
        district = session_data.get("district") or entities.get("district")
        address = session_data.get("address") or entities.get("address", "Not provided")
        landmark = session_data.get("landmark") or entities.get("landmark", "Not provided")
        # 3-line formal description generator for offline & preview handoffs
        gen_desc = session_data.get("generated_description")
        user_desc = session_data.get("description")
        
        if gen_desc:
            raw_desc = gen_desc
        elif user_desc and user_desc.strip() != address.strip() and len(user_desc.strip()) > 10:
            raw_desc = user_desc
        else:
            line1 = f"Official Grievance Notice regarding {complaint_type or category} reported under {department or 'Municipal Authority'} ({category})."
            line2 = f"Location & Site details: {address}, Landmark: {landmark}, District: {district}, State: {state}."
            line3 = "Public Urgency: Escalated for immediate municipal inspection and resolution dispatch."
            raw_desc = f"{line1}\n{line2}\n{line3}"
        
        # Call AI Microservice to generate a professional draft
        description = raw_desc
        import sys
        if not (len(sys.argv) > 1 and sys.argv[1] == 'test'):
            import requests
            ai_url = getattr(settings, "AI_SERVICE_URL", "http://localhost:8010")
            try:
                category_name = session_data.get("category", "General")
                category_mapping = {
                    "Road & Infrastructure": "ROAD_DAMAGE",
                    "Water Supply": "WATER_SUPPLY",
                    "Electricity": "ELECTRICITY",
                    "Sanitation & Waste": "GARBAGE_COLLECTION",
                    "Drainage & Sewerage": "DRAINAGE",
                    "Public Safety": "PUBLIC_SAFETY",
                }
                category_code = category_mapping.get(category_name, "OTHER")
                payload = {
                    "text": raw_desc,
                    "category_code": category_code,
                    "language": "en"
                }
                res = requests.post(f"{ai_url}/api/v1/complaints/draft", json=payload, timeout=10)
                if res.status_code == 200:
                    draft_data = res.json()
                    description = draft_data.get("draft_text", raw_desc)
            except Exception as e:
                print(f"Warning: Failed to fetch AI draft: {str(e)}")

        is_valid_for_dispatch = bool(complaint_type and department and state and district)
        office_name = "Designated Department Office"
        recipient_email = "officer@domain.gov.in"
        portal_url = "https://pgportal.gov.in/"

        if state and district and department:
            office_info = self.office_finder.find_office(
                department_name=department,
                district_name=district,
                state_name=state
            )
            recipient_email = office_info.get("email") or recipient_email
            office_name = office_info.get("name") or office_name
            portal_url = office_info.get("portal_url") or portal_url
        
        # Local testing override: send to pratham6306@gmail.com (and not running unit tests)
        import sys
        if not (len(sys.argv) > 1 and sys.argv[1] == 'test'):
            recipient_email = "pratham6306@gmail.com"

        # Compile attachments for preview text body
        text_attachments = ""
        attachment_names = []
        complaint_id = session_data.get("complaint_id")
        if complaint_id:
            try:
                from complaints.models import Complaint
                complaint_obj = Complaint.objects.get(id=complaint_id)
                images = complaint_obj.images.all()
                if images.exists():
                    import os
                    text_attachments = "ATTACHED EVIDENCE:\n"
                    for img in images:
                        if img.image:
                            img_name = os.path.basename(img.image.name)
                            text_attachments += f"- {img_name}\n"
                            attachment_names.append(img_name)
                    text_attachments += "\n"
            except Exception:
                pass

        subject = f"[Grievance Registration] {complaint_type} - {district}, {state}"

        citizen_contact_text = (
            "CITIZEN CONTACT INFORMATION:\n• Email: Anonymous Citizen (Contact details hidden for privacy)\n\n"
            if is_anonymous else
            f"CITIZEN CONTACT INFORMATION:\n• Email: {user_email}\n\n"
        )

        text_content = (
            f"Dear Sir/Madam,\n\n"
            f"Subject: Grievance regarding {complaint_type} in {district}\n\n"
            f"This is to bring to your official notice a public grievance compiled by a citizen via the Aavedan Saathi platform. The details of the issue are listed below:\n\n"
            f"--------------------------------------------------\n"
            f"GRIEVANCE DETAILS:\n"
            f"--------------------------------------------------\n"
            f"• Department: {department}\n"
            f"• Category: {category}\n"
            f"• Complaint Type: {complaint_type}\n"
            f"• Priority/Urgency: {priority}\n"
            f"• Description: {description}\n\n"
            f"LOCATION DETAILS:\n"
            f"• Specific Address: {address}\n"
            f"• Nearby Landmark: {landmark}\n"
            f"• District: {district}\n"
            f"• State: {state}\n\n"
            f"{text_attachments}"
            f"{citizen_contact_text}"
            f"Please review the details and initiate corrective action at the earliest.\n\n"
            f"Sincerely,\n"
            f"Aavedan Saathi Grievance Assistant\n"
        )

        return {
            "sender_email": "Anonymous (Protected)" if is_anonymous else user_email,
            "receiver_email": recipient_email,
            "office_name": office_name,
            "subject": subject,
            "body_text": text_content,
            "attachments": attachment_names,
            "portal_url": portal_url,
            "draft_description": description,
            "original_description": raw_desc,
            "category": category,
            "department": department,
            "state": state,
            "district": district,
            "address": address,
            "landmark": landmark,
            "is_valid_for_dispatch": is_valid_for_dispatch
        }
