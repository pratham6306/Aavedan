# 🏛️ Aavedan Setu — AI-Powered Civic Grievance Triage & Resolution Platform

<div align="center">

**SOA IDEATHON 2026 · Problem Statements SOAIDEATHON-S36 & SOAIDEATHON-S1**

*An intelligent, Human-in-the-Loop Agentic AI system that empowers citizens to file, track, and resolve public grievances through conversational AI — with community-driven prioritization, smart duplicate detection, and automated official email dispatching.*

[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🌟 What is Aavedan Setu?

**Aavedan Setu** (आवेदन सेतु — *"Bridge of Applications"*) is an enterprise-grade citizen empowerment platform that bridges the gap between citizens and government departments. It combines:

- 🤖 **Aavedan Saathi** — A conversational AI assistant powered by Google Gemini that guides citizens through the entire grievance filing process in natural language
- 📧 **Automated Official Email Dispatch** — AI-drafted, professionally formatted grievance emails sent directly to the correct department office
- 🗳️ **Community Upvoting** — Citizens can support each other's complaints to drive collective prioritization
- 🔍 **Smart Duplicate Detection** — Prevents redundant filings by detecting similar complaints using fuzzy category + location matching
- 🔒 **Anonymous Filing** — Citizens can hide their identity from authorities while still receiving tracking receipts
- 📊 **Welfare Scheme Recommendations** — AI-powered eligibility matching for 100+ government welfare schemes across Indian states

---

## 📊 System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                     CITIZEN BROWSER (Port 5173)                    │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Dashboard    │  │ Complaints   │  │  Aavedan Saathi AI Chat  │ │
│  │  (Charts)     │  │ (CRUD+Filter)│  │  (Floating Assistant)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Scheme       │  │ My Complaints│  │  Email Preview Modal     │ │
│  │  Recommender  │  │ (Owner CRUD) │  │  (Dispatch / Handoff)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────┘
                             │  JSON / JWT Auth
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                  DJANGO DRF BACKEND (Port 8000)                    │
│                                                                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Auth     │  │ Complaints   │  │ AI Orchestr. │  │ Schemes   │ │
│  │ (JWT)    │  │ (CRUD+Filter)│  │ (Session Mem)│  │ (Search)  │ │
│  └──────────┘  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Email    │  │ Duplicate    │  │ Support/     │  │ Office    │ │
│  │ Dispatch │  │ Checker      │  │ Upvote API   │  │ Finder    │ │
│  └──────────┘  └──────────────┘  └──────────────┘  └───────────┘ │
└───────────┬───────────────────────────────┬────────────────────────┘
            │ Read/Write                    │ JSON API Calls
            ▼                               ▼
┌────────────────────────┐    ┌──────────────────────────────────────┐
│   PostgreSQL Database  │    │     FASTAPI AI MICROSERVICE          │
│                        │    │           (Port 8010)                 │
│  • States & Districts  │    │                                      │
│  • Categories & Depts  │    │  ┌────────────┐  ┌───────────────┐  │
│  • Complaints          │    │  │ Classify   │  │ Draft         │  │
│  • Complaint Supports  │    │  │ (Intent +  │  │ (Professional │  │
│  • Welfare Schemes     │    │  │  Category) │  │  Email Text)  │  │
│  • Office Directory    │    │  └────────────┘  └───────────────┘  │
│  • User Accounts       │    │  ┌────────────┐  ┌───────────────┐  │
│                        │    │  │ Recommend  │  │ Translate     │  │
│                        │    │  │ (Schemes)  │  │ (Multi-lang)  │  │
│                        │    │  └────────────┘  └───────────────┘  │
└────────────────────────┘    └──────────────┬───────────────────────┘
                                             │ Gemini API (SDK)
                                             ▼
                              ┌──────────────────────────────────────┐
                              │    Google Gemini Flash LLM            │
                              │    (with Resilient Local Fallback)    │
                              └──────────────────────────────────────┘
```

---

## 🔑 Key Features

### 🤖 AI-Powered Grievance Assistant (Aavedan Saathi)
| Feature | Description |
|---------|-------------|
| **Conversational Filing** | Citizens describe issues in natural language (e.g., *"There's a huge pothole near the bus stop in Khurda"*) and the AI guides them through the process |
| **Intent Classification** | Multi-layered pipeline detects intent: `FILE_COMPLAINT`, `CHECK_STATUS`, `ASK_SCHEME`, `GREETING`, or `GENERAL_QUERY` |
| **Smart Entity Extraction** | AI extracts complaint type, category, department, state, district, and urgency from unstructured text |
| **Professional Draft Generation** | Raw citizen text → formal, professional grievance letter via Gemini LLM |
| **Dual Submission Options** | **Option 1:** AI auto-dispatches official email · **Option 2:** Handoff to manual form for image uploads |
| **Session Memory** | Stateful conversations across multiple messages with entity accumulation |
| **Resilient Fallback** | When Gemini API is rate-limited (429), the local rules-based engine takes over seamlessly |

### 📧 Official Email Dispatch System
| Feature | Description |
|---------|-------------|
| **Office Lookup** | Finds the correct department office email based on citizen's district + state + department |
| **Inline Image Embedding** | Evidence photos embedded directly in email body via `Content-ID` (`cid:evidence_X`), not as attachments |
| **Anonymous Dispatch** | Citizens can file anonymously — their name/email is replaced with *"Anonymous Citizen"* and receipt goes via BCC |
| **Email Preview Modal** | Full-screen preview of the email before sending, with copy-to-clipboard and official portal link |
| **Dispatch Validation** | Smart guard disables the send button when location details are incomplete, with warning banners |

### 🗳️ Community Upvoting & Support System
| Feature | Description |
|---------|-------------|
| **Support Toggle** | One-click upvote/downvote support button on every complaint (both list and detail views) |
| **Support Counter** | Live count of citizens who support each grievance, displayed on every complaint card |
| **Collective Prioritization** | Highly-supported complaints surface to the top, enabling community-driven triage |

### 🔍 Fuzzy Duplicate Detection
| Feature | Description |
|---------|-------------|
| **Smart Matching** | Detects existing complaints with the same category + department within ~500m proximity |
| **Animated Warnings** | Visual alert banners on both the AI chat modal and manual form when duplicates are found |
| **View & Support** | Direct links to duplicate complaints so citizens can support existing grievances instead of creating redundant ones |

### 🔒 Privacy & Anonymous Filing
| Feature | Description |
|---------|-------------|
| **Toggle Checkbox** | One-click anonymity toggle on both the manual form and AI email preview modal |
| **Name Masking** | All public-facing views display *"Anonymous Citizen"* for anonymous complaints |
| **BCC Routing** | Official receipt copies sent via BCC instead of CC to protect citizen identity |

### 🔎 Advanced Multi-Dimensional Filtering
| Feature | Description |
|---------|-------------|
| **6 Filter Dimensions** | Filter by **Status**, **Priority**, **Category**, **Department**, **State**, and **District** |
| **Dynamic Metadata** | All filter dropdown options are loaded live from the database (not hardcoded) |
| **Cascading Location** | Selecting a State dynamically loads its Districts |
| **URL Persistence** | Active filters are synced to URL search parameters for shareable, bookmarkable filtered views |
| **Active Filter Badge** | Counter badge on the filter toggle button showing how many filters are active |
| **Clear All** | One-click reset button to clear all active filters |
| **Available On Both Pages** | Full filtering on both **My Complaints** and **All Complaints** views |

### 📊 Dashboard & Analytics
| Feature | Description |
|---------|-------------|
| **Statistics Cards** | Total, pending, in-progress, and resolved complaint counts with animated counters |
| **Monthly Trends** | Line chart showing complaint volume over time |
| **Department Distribution** | Pie/doughnut chart breaking down complaints by department |
| **Resolution Metrics** | Average resolution time tracking |

### 🎓 Welfare Scheme Recommendation Engine
| Feature | Description |
|---------|-------------|
| **AI-Powered Matching** | Gemini LLM evaluates eligibility against 100+ schemes using income, age, caste, education, and state |
| **Residency Enforcement** | Region-locked schemes (e.g., Odisha-only yojanas) are flagged when user is from another state |
| **Fuzzy Fallback Search** | Typo-tolerant keyword matching when LLM is unavailable (handles `"schlorshipp"` → Education) |
| **Smart Filtering** | Hides ineligible schemes by default; explains specific failure reasons on demand |

### 🎨 Premium UI/UX
| Feature | Description |
|---------|-------------|
| **Glassmorphism Design** | Frosted glass cards with backdrop blur and layered depth |
| **Micro-Animations** | Framer Motion page transitions, card stagger effects, skeleton loaders |
| **Responsive Layout** | Mobile-first design that scales beautifully from phone to desktop |
| **Interactive Map** | Leaflet coordinate picker for precise grievance geolocation |
| **AI Assist Button** | One-click AI description enhancement on the manual complaint form |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | Component framework |
| Vite 6 | Build tool & dev server |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state management & caching |
| Axios | HTTP client with JWT interceptors |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Premium animations & transitions |
| Chart.js + React-Chartjs-2 | Dashboard analytics charts |
| Leaflet + React-Leaflet | Interactive maps & coordinate picking |
| React Toastify | Notification toasts |
| React Hook Form | Form state management with validation |
| React Icons (Hi2 & Fi) | Icon library |

### Backend (Django DRF)
| Technology | Purpose |
|-----------|---------|
| Django 5.x | Web framework |
| Django REST Framework | REST API layer |
| SimpleJWT | JWT authentication |
| django-filters | Advanced queryset filtering |
| PostgreSQL | Production database |
| SQLite | Development/testing fallback |
| SMTP (Django mail) | Email dispatch with inline attachments |

### AI Microservice (FastAPI)
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async API framework |
| Uvicorn | ASGI server |
| Google GenAI SDK | Gemini LLM client |
| Pydantic v2 | Strict request/response validation |
| HTTPX | Async HTTP client |

---

## 📂 Project Structure

```
Aavedan-Setu/
├── backend/                       # Django DRF Core Backend
│   ├── accounts/                  # User registration, JWT auth, profiles
│   ├── complaints/                # Grievance CRUD, filtering, support/upvote system
│   │   ├── models.py              # Complaint + ComplaintSupport models
│   │   ├── views.py               # List, Detail, Create, Update, Delete, Support, Duplicate Check
│   │   ├── filters.py             # Multi-field filterset (status, priority, category, dept, location)
│   │   └── serializers.py         # List, Detail, Create serializers with anonymous masking
│   ├── departments/               # Government departments registry
│   ├── categories/                # Complaint categories & types
│   ├── locations/                 # Indian states & districts (36 states, 700+ districts)
│   ├── schemes/                   # Welfare schemes database & eligibility rules
│   ├── ai/                        # AI orchestrator, session memory, email dispatcher
│   │   ├── services/
│   │   │   ├── orchestrator.py    # Intent detection → entity extraction → response generation
│   │   │   ├── memory.py          # In-memory session state manager
│   │   │   ├── email_dispatcher.py # Office lookup, email compilation, anonymous routing
│   │   │   ├── intent_detector.py # Keyword-based intent classifier (LLM fallback)
│   │   │   └── db_analyzer.py     # Rules-based category/department matcher
│   │   └── views.py               # Chat, Email Preview, Email Send, Scheme Recommend APIs
│   ├── seed_all.py                # One-command database seeder
│   └── manage.py
│
├── Ai/                            # FastAPI AI Microservice
│   ├── app/
│   │   ├── api/routers/           # /classify, /draft, /recommend, /translate endpoints
│   │   ├── llm/                   # Gemini client with retry policies & JSON parsing
│   │   ├── prompts/               # LLM prompt templates (classification, drafting, schemes)
│   │   ├── services/              # AI orchestrator, response validators
│   │   └── main.py                # FastAPI app entrypoint
│   ├── .env                       # Gemini API key & model configuration
│   └── requirements.txt
│
├── frontend/                      # React 19 Citizen Portal
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/            # Sidebar, Navbar, Footer, FloatingAIAssistant
│   │   ├── context/               # AuthContext (JWT state management)
│   │   ├── hooks/                 # TanStack Query hooks for complaints, schemes
│   │   ├── pages/
│   │   │   ├── Dashboard/         # Analytics dashboard with Chart.js visualizations
│   │   │   ├── Complaint/         # CreateComplaint, MyComplaints, ComplaintList, ComplaintDetail, EditComplaint
│   │   │   ├── Schemes/           # SchemeList, SchemeDetail (AI-powered recommendations)
│   │   │   └── Auth/              # Login, Register pages
│   │   ├── services/              # Axios API service wrappers
│   │   └── utils/                 # Helper formatters, status colors, date utilities
│   └── vite.config.js             # Dev server proxy to Django backend
│
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ (npm)**
- **PostgreSQL 15+** *(optional — falls back to SQLite)*
- **Google Gemini API Key** *(free tier available at [ai.google.dev](https://ai.google.dev/))*

---

### 1️⃣ Backend Setup (Django REST Framework)

```bash
# Navigate to project root
cd gov_complaint_schemes

# Create and activate virtual environment
python -m venv myenv
myenv\Scripts\activate           # Windows
# source myenv/bin/activate      # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Create backend/.env with:
#   SECRET_KEY=your_django_secret_key
#   DEBUG=True
#   DB_NAME=gov_complaint_db
#   DB_USER=postgres
#   DB_PASSWORD=your_password

# Run migrations
cd backend
python manage.py makemigrations
python manage.py migrate

# Seed the database (categories, departments, locations, schemes)
python seed_all.py

# Create admin account
python manage.py createsuperuser

# Start the server
python manage.py runserver
# → http://127.0.0.1:8000/
```

---

### 2️⃣ AI Microservice Setup (FastAPI)

```bash
# Navigate to Ai directory
cd ../Ai

# Install requirements (reuse same venv)
pip install -r requirements.txt

# Configure environment
# Create Ai/.env with:
#   APP_ENVIRONMENT=local
#   GEMINI_API_KEY=your_gemini_api_key_here
#   GEMINI_MODEL_NAME=gemini-flash-latest
#   DB_DSN=postgresql://postgres:password@localhost:5432/gov_assist_db

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
# → http://127.0.0.1:8010/
```

---

### 3️⃣ Frontend Setup (React 19 + Vite)

```bash
# Navigate to frontend
cd ../frontend

# Install npm packages
npm install

# Start development server
npm run dev
# → http://localhost:5173/
```

---

## 📊 Database Seeding

Aavedan Setu includes comprehensive seeding scripts to populate the database with Indian government data:

```bash
cd backend
python seed_all.py
```

This runs the following seeders in dependency order:

| Seeder | Data |
|--------|------|
| `seed_categories.py` | 6 complaint categories (Road & Infrastructure, Water Supply, Electricity, etc.) |
| `seed_departments.py` | Corresponding government departments |
| `seed_locations.py` | 36 Indian states/UTs with 700+ districts |
| `seed_knowledge.py` | Department office directory with contact emails |
| `seed_schemes.py` | 100+ welfare schemes with eligibility criteria |

### Custom CSV Import
For importing custom schemes or office directories, refer to the specifications document:
- 📄 **[CSV_Seeding_Templates_Specifications.pdf](CSV_Seeding_Templates_Specifications.pdf)**

---

## 🔐 API Reference

### Auth Module — `/api/auth/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Create a citizen account |
| `POST` | `/api/auth/login/` | Login and receive JWT tokens |
| `POST` | `/api/auth/token/refresh/` | Refresh expired access tokens |
| `GET` | `/api/auth/profile/` | Fetch authenticated user profile |

### Complaints Module — `/api/complaints/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/complaints/` | List all complaints (with filtering & search) |
| `GET` | `/api/complaints/my/` | List current user's complaints |
| `POST` | `/api/complaints/create/` | Create a new grievance |
| `GET` | `/api/complaints/{id}/` | Complaint detail with full metadata |
| `PATCH` | `/api/complaints/{id}/update/` | Edit complaint fields |
| `DELETE` | `/api/complaints/{id}/delete/` | Soft-delete a complaint |
| `POST` | `/api/complaints/{id}/support/` | Toggle upvote/support on a complaint |
| `POST` | `/api/complaints/check-duplicate/` | Check for existing similar complaints |
| `POST` | `/api/complaints/{id}/images/upload/` | Upload evidence images |

### AI Assistant Module — `/api/ai/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat/` | Conversational chat with Aavedan Saathi |
| `POST` | `/api/ai/chat/email-preview/` | Generate email preview with draft description |
| `POST` | `/api/ai/chat/send-email/` | Dispatch official grievance email to department |
| `POST` | `/api/ai/recommend-schemes/` | AI-powered welfare scheme recommendations |

### AI Microservice — `http://localhost:8010/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/api/v1/complaints/classify` | Classify complaint category & intent |
| `POST` | `/api/v1/complaints/draft` | Generate professional grievance draft |
| `POST` | `/api/v1/schemes/recommend` | Evaluate scheme eligibility |
| `POST` | `/api/v1/translate` | Multi-language translation |

---

## 📧 Core Workflows

### 1. AI Grievance Assistant & Email Dispatching

```
Citizen: "There's too much water logged due to heavy rain near the bus stop in Khurda, Odisha"
    │
    ▼
┌─ Intent Detection ─────────────────────────────────────────────┐
│  Intent: FILE_COMPLAINT                                        │
│  Category: Drainage & Sewerage                                 │
│  Department: Municipal Corporation                             │
│  Location: Khurda, Odisha                                      │
│  Description: "too much water logged due to heavy rain..."     │
└────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Duplicate Check ──────────────────────────────────────────────┐
│  Checks existing complaints with same category + location      │
│  If found → Shows warning banner with "View & Support" link    │
└────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Two Options ──────────────────────────────────────────────────┐
│                                                                │
│  Option 1: Send Email                Option 2: Complete Form   │
│  ┌──────────────────┐                ┌──────────────────────┐  │
│  │ AI generates      │                │ Navigate to manual   │  │
│  │ professional draft │                │ form with all fields │  │
│  │ → Preview modal   │                │ auto-filled from AI  │  │
│  │ → Office lookup   │                │ → Upload images      │  │
│  │ → Send official   │                │ → Submit to database │  │
│  │   email to dept   │                │                      │  │
│  └──────────────────┘                └──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 2. Community Support & Prioritization

```
Citizen A files: "Street light broken on MG Road, Bhubaneswar"
    │
    ├── Citizen B sees it in All Complaints → Clicks "Support" → Count: 2
    ├── Citizen C sees it in All Complaints → Clicks "Support" → Count: 3
    ├── Citizen D files same complaint → Duplicate warning shown
    │   └── Clicks "View & Support" → Redirected → Count: 4
    │
    ▼
Complaint now has 4 community supports → Higher visibility for authorities
```

### 3. Welfare Scheme Recommendation

```
Citizen asks: "What scholarship schemes are available for SC students in Odisha?"
    │
    ▼
┌─ AI Evaluation ────────────────────────────────────────────────┐
│  Matches against 100+ schemes using:                           │
│  • Income criteria    • Age limits                             │
│  • Caste category     • Education level                        │
│  • State residency    • Gender requirements                    │
│                                                                │
│  Returns: Eligible schemes with benefit details                │
│  Flags: Region-locked schemes from other states                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing

```bash
# Run Django backend test suite
cd backend
python manage.py test

# Health check for AI microservice
curl http://127.0.0.1:8010/health
```

---

## 🏗️ Problem Statement Alignment

### SOAIDEATHON-S36: Civic Grievance Triage and Budgeting
> *"Build an AI-powered platform for civic grievance classification, prioritization, and community-driven triage."*

✅ AI-powered complaint classification with Gemini LLM  
✅ Community upvoting system for collective prioritization  
✅ Fuzzy duplicate detection to prevent redundant filings  
✅ Multi-dimensional filtering (status, priority, category, department, location)  
✅ Automated email dispatch to correct government offices  

### SOAIDEATHON-S1: Human-in-the-Loop Agentic AI
> *"Create an agentic AI system where humans remain in control of critical decisions."*

✅ AI suggests — Human approves (email preview before dispatch)  
✅ Dual submission paths (AI auto-dispatch OR manual form completion)  
✅ Citizens can override AI-inferred categories and departments  
✅ Anonymous filing option gives citizens control over privacy  
✅ Resilient hybrid architecture: LLM + local rules-based fallback  

---

## 👥 Team

**Aavedan-Setu** — SOA IDEATHON 2026

---

<div align="center">

*Built with ❤️ for Digital India 🇮🇳*

**Empowering citizens. Bridging governance. One complaint at a time.**

</div>
