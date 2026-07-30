# ai/tests.py
from django.test import TestCase
from django.core import mail
from django.urls import reverse
from rest_framework.test import APIClient
from accounts.models import User
from ai.constants import Intent, NextAction
from ai.services.text_preprocessor import TextPreprocessor
from ai.services.intent_detector import IntentDetector
from ai.services.knowledge_retriever import KnowledgeRetriever
from ai.services.complaint_analyzer import ComplaintAnalyzer
from ai.services.location_extractor import LocationExtractor
from ai.services.department_resolver import DepartmentResolver
from ai.services.office_finder import OfficeFinder
from ai.services.decision_engine import DecisionEngine
from ai.services.memory import MemoryManager
from ai.services.response_generator import ResponseGenerator
from ai.services.orchestrator import AIOrchestrator
from ai.services.email_dispatcher import EmailDispatcher

from locations.models import State, District
from departments.models import Department, DepartmentOffice
from categories.models import ComplaintCategory
from knowledge.models import ComplaintType, ComplaintKeyword, RequiredField


class AIServicesTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        # 1. Locations
        cls.state = State.objects.create(name="Odisha", code="OD")
        cls.district = District.objects.create(state=cls.state, name="Khordha")

        # 2. Category & Department
        cls.category = ComplaintCategory.objects.create(name="Road & Infrastructure")
        cls.department = Department.objects.create(name="Public Works Department (PWD)")

        # 3. Complaint Type, Keywords, and Required Fields
        cls.complaint_type = ComplaintType.objects.create(
            name="Pothole",
            slug="pothole",
            category=cls.category,
            department=cls.department,
            priority="MEDIUM",
            estimated_resolution_days=7,
            is_active=True
        )

        cls.keyword1 = ComplaintKeyword.objects.create(
            complaint_type=cls.complaint_type,
            keyword="pothole",
            weight=1.0
        )
        cls.keyword2 = ComplaintKeyword.objects.create(
            complaint_type=cls.complaint_type,
            keyword="road damage",
            weight=1.0
        )

        cls.req_field_address = RequiredField.objects.create(
            complaint_type=cls.complaint_type,
            field_name="address",
            display_name="Address",
            is_required=True
        )
        cls.req_field_district = RequiredField.objects.create(
            complaint_type=cls.complaint_type,
            field_name="district",
            display_name="District",
            is_required=True
        )

        # 4. Department Office
        cls.office = DepartmentOffice.objects.create(
            department=cls.department,
            state=cls.state,
            district=cls.district,
            office_name="PWD Bhubaneswar Division",
            address="Bhubaneswar PWD Office",
            email="pwd.bhubaneswar@odisha.gov.in",
            phone="0674-2391234",
            is_active=True
        )

        # 5. User for API and dispatch tests
        cls.user = User.objects.create_user(
            email="citizen@example.com",
            password="securepassword123",
            full_name="Citizen One"
        )

    def test_text_preprocessor(self):
        preprocessor = TextPreprocessor()
        raw_text = "  There is a POTHOLE near KIIT Square!!!  "
        clean_text = preprocessor.preprocess(raw_text)
        self.assertEqual(clean_text, "there is a pothole near kiit square")

    def test_intent_detector(self):
        detector = IntentDetector()
        self.assertEqual(detector.detect("hello there"), Intent.GREETING)
        self.assertEqual(detector.detect("pothole on the street"), Intent.FILE_COMPLAINT)
        self.assertEqual(detector.detect("where is the scheme"), Intent.SEARCH_SCHEME)
        self.assertEqual(detector.detect("yes proceed"), Intent.CONFIRM)
        self.assertEqual(detector.detect("goodbye"), Intent.GOODBYE)
        self.assertEqual(detector.detect("random non keyword message"), Intent.GENERAL_QUERY)

    def test_knowledge_retriever(self):
        retriever = KnowledgeRetriever()
        # Direct keyword match
        res = retriever.retrieve("there is a pothole near my house")
        self.assertEqual(res["complaint_type"], "Pothole")
        self.assertEqual(res["category"], "Road & Infrastructure")
        self.assertEqual(res["department"], "Public Works Department (PWD)")
        self.assertTrue(res["confidence_score"] > 0.70)
        self.assertIn("pothole", res["matching_keywords"])

        # No keyword match
        res_empty = retriever.retrieve("hello how are you")
        self.assertIsNone(res_empty["complaint_type"])

    def test_complaint_analyzer_missing_fields(self):
        analyzer = ComplaintAnalyzer()
        session_data = {
            "entities": {
                "state": "Odisha"
            }
        }
        res = analyzer.analyze("there is a pothole", session_data)
        self.assertEqual(res["complaint_type"], "Pothole")
        # District and address are missing from session data, and they are required fields!
        self.assertIn("district", res["missing_fields"])
        self.assertIn("address", res["missing_fields"])

        session_data_complete = {
            "entities": {
                "state": "Odisha",
                "district": "Khordha",
                "address": "KIIT Square Road"
            }
        }
        res_complete = analyzer.analyze("there is a pothole", session_data_complete)
        self.assertEqual(len(res_complete["missing_fields"]), 0)

    def test_location_extractor(self):
        extractor = LocationExtractor()
        # General matching
        res = extractor.extract(
            text="There is a pothole near KIIT Square in Odisha",
            preprocessed_text="there is a pothole near kiit square in odisha"
        )
        self.assertEqual(res["state"], "Odisha")
        self.assertEqual(res["landmark"], "KIIT Square")

        # Context-aware override
        res_context = extractor.extract(
            text="Khordha",
            preprocessed_text="khordha",
            awaiting_field="district"
        )
        self.assertEqual(res_context["district"], "Khordha")
        self.assertEqual(res_context["state"], "Odisha")

    def test_office_finder(self):
        finder = OfficeFinder()
        # Existing office lookup
        res = finder.find_office("Public Works Department (PWD)", "Khordha", "Odisha")
        self.assertEqual(res["name"], "PWD Bhubaneswar Division")
        self.assertEqual(res["email"], "pwd.bhubaneswar@odisha.gov.in")

        # Fallback office lookup
        res_fallback = finder.find_office("Water Supply Department", "Khordha", "Odisha")
        self.assertEqual(res_fallback["name"], "Water Supply Department Office, Khordha")
        self.assertEqual(res_fallback["email"], "complaints.water-supply-department@odisha.gov.in")

    def test_decision_engine(self):
        engine = DecisionEngine()
        # Awaiting details
        act1 = engine.decide(Intent.GREETING, 0.0, None, {}, [])
        self.assertEqual(act1, NextAction.ASK_COMPLAINT_DETAILS)

        # Missing state
        act2 = engine.decide(Intent.FILE_COMPLAINT, 0.95, "Pothole", {}, ["state", "district"])
        self.assertEqual(act2, NextAction.ASK_STATE)

        # Confirm and file
        act3 = engine.decide(Intent.FILE_COMPLAINT, 0.95, "Pothole", {}, [])
        self.assertEqual(act3, NextAction.CONFIRM_AND_FILE)

        # File complaint on confirmation
        act4 = engine.decide(Intent.CONFIRM, 0.95, "Pothole", {"next_action": "CONFIRM_AND_FILE"}, [])
        self.assertEqual(act4, NextAction.FILE_COMPLAINT)

    def test_memory_manager_entities_merge(self):
        memory = MemoryManager()
        session_id = "test-session-123"
        memory.clear_session(session_id)

        # Set initial
        memory.update_session(session_id, complaint_type="Pothole", entities={"state": "Odisha"})
        session = memory.get_session(session_id)
        self.assertEqual(session["complaint_type"], "Pothole")
        self.assertEqual(session["entities"]["state"], "Odisha")

        # Merge new entities without erasing state
        memory.update_session(session_id, entities={"district": "Khordha"})
        session = memory.get_session(session_id)
        self.assertEqual(session["entities"]["state"], "Odisha")
        self.assertEqual(session["entities"]["district"], "Khordha")

    def test_orchestrator_multi_turn_flow(self):
        orchestrator = AIOrchestrator()
        session_id = "flow-session-999"
        orchestrator.memory.clear_session(session_id)

        # Turn 1: User greets
        res = orchestrator.process("Hello", session_id)
        self.assertEqual(res["next_action"], NextAction.ASK_COMPLAINT_DETAILS.value)

        # Turn 2: User states complaint
        res = orchestrator.process("There is a pothole near KIIT Square", session_id)
        self.assertEqual(res["complaint_type"], "Pothole")
        # Pothole requires address, district, state. Landmark is extracted, state is matched from "Odisha" or wait - did user mention state?
        # User message: "There is a pothole near KIIT Square" (No State, No District).
        # State and District should be missing.
        self.assertEqual(res["next_action"], NextAction.ASK_STATE.value)

        # Turn 3: User answers state
        res = orchestrator.process("Odisha", session_id)
        self.assertEqual(res["entities"]["state"], "Odisha")
        self.assertEqual(res["next_action"], NextAction.ASK_DISTRICT.value)

        # Turn 4: User answers district
        res = orchestrator.process("Khordha", session_id)
        self.assertEqual(res["entities"]["district"], "Khordha")
        self.assertEqual(res["next_action"], NextAction.ASK_ADDRESS.value)

        # Turn 5: User answers address
        res = orchestrator.process("KIIT Square Road", session_id)
        self.assertEqual(res["entities"]["address"], "KIIT Square Road")
        self.assertEqual(res["next_action"], NextAction.CONFIRM_AND_FILE.value)

        # Turn 6: User confirms
        res = orchestrator.process("Yes, please", session_id)
        self.assertEqual(res["next_action"], NextAction.FILE_COMPLAINT.value)
        self.assertIn("PWD Bhubaneswar Division", res["office"]["name"])

        # Session should be cleared automatically after completion
        cleared_session = orchestrator.memory.get_session(session_id)
        self.assertIsNone(cleared_session["complaint_type"])

    def test_email_dispatcher(self):
        # Clear outbox
        mail.outbox = []

        dispatcher = EmailDispatcher()
        session_data = {
            "complaint_type": "Pothole",
            "category": "Road & Infrastructure",
            "department": "Public Works Department (PWD)",
            "priority": "MEDIUM",
            "description": "Large pothole blocking the lane.",
            "entities": {
                "state": "Odisha",
                "district": "Khordha",
                "address": "KIIT Square Road",
                "landmark": "Near campus gate"
            }
        }
        user_email = "testcitizen@example.com"
        
        # Trigger sending
        success = dispatcher.send_grievance_email(session_data, user_email)
        self.assertTrue(success)
        
        # Verify email in django test outbox
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn("pwd.bhubaneswar@odisha.gov.in", sent_email.to)
        self.assertIn(user_email, sent_email.cc)
        self.assertIn("[Grievance Registration] Pothole", sent_email.subject)
        self.assertIn("Large pothole blocking the lane.", sent_email.body)

    def test_send_email_api_view(self):
        # Clear outbox
        mail.outbox = []

        # Authenticate test user
        client = APIClient()
        client.force_authenticate(user=self.user)
        
        # Populate session state directly in memory
        memory = MemoryManager()
        session_id = "4769018e-4da5-4ba9-8070-10d21793699a" # Needs to be valid UUID string for serializer
        memory.clear_session(session_id)
        memory.update_session(
            session_id,
            complaint_type="Pothole",
            category="Road & Infrastructure",
            department="Public Works Department (PWD)",
            priority="MEDIUM",
            description="Large pothole blocking the lane.",
            entities={
                "state": "Odisha",
                "district": "Khordha",
                "address": "KIIT Square Road",
                "landmark": "Near campus gate"
            }
        )
        
        # Post request to send-email view
        url = reverse("ai-send-email")
        response = client.post(url, {"session_id": session_id}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertIn("Grievance email dispatched successfully", response.data["message"])
        
        # Verify session has been cleared automatically upon success
        cleared_session = memory.get_session(session_id)
        self.assertIsNone(cleared_session["complaint_type"])
