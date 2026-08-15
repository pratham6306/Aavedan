# 🏛️ Aavedan Setu — AI-Powered Civic Grievance Triage & Resolution Platform

<div align="center">

**SIH 2026 · Problem Statements S36 & S1**

*An intelligent, Human-in-the-Loop Agentic AI system that empowers citizens to file, track, and resolve public grievances through conversational AI — with community-driven participatory budgeting, smart duplicate detection, Google OAuth 2.0, and automated official email dispatching.*

[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Google OAuth](https://img.shields.io/badge/Google_OAuth-2.0-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/identity)
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
- 💰 **Participatory Civic Budgeting** — Citizens vote to fund ward-level municipal infrastructure repair projects from a transparent District Repair Pool
- 🔑 **Google OAuth 2.0** — One-click Sign In with Google with official account chooser popup, zero-friction citizen onboarding
- 📸 **Geotagged Proof Resolution Ledger** — Officers upload geotagged "After Repair" proof; citizens verify or reject via a community ledger

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
│  │  Civic        │  │ Officer      │  │  Google OAuth 2.0        │ │
│  │  Budgeting    │  │ Proof Ledger │  │  Account Chooser Popup   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└────────────────────────────┬───────────────────────────────────────┘
                             │  JSON / JWT Auth
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                  DJANGO DRF BACKEND (Port 8000)                    │
│                                                                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Auth +   │  │ Complaints   │  │ AI Orchestr. │  │ Schemes   │ │
│  │ Google   │  │ (CRUD+Filter)│  │ (Session Mem)│  │ (Search)  │ │
│  │ OAuth    │  └──────────────┘  └──────────────┘  └───────────┘ │
│  └──────────┘  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│                │ CivicProject │  │ Officer      │  │ Budget    │ │
│                │ Vote API     │  │ Resolve API  │  │ Analytics │ │
│                └──────────────┘  └──────────────┘  └───────────┘ │
└───────────┬───────────────────────────────┬────────────────────────┘
            │ Read/Write                    │ JSON API Calls
            ▼                               ▼
┌────────────────────────┐    ┌──────────────────────────────────────┐
│   PostgreSQL/SQLite DB │    │     FASTAPI AI MICROSERVICE          │
│                        │    │           (Port 8010)                 │
│  • States & Districts  │    │                                      │
│  • CivicProject Models │    │  ┌────────────┐  ┌───────────────┐  │
│  • CivicProjectVote    │    │  │ Classify   │  │ Draft         │  │
│  • DepartmentBudget    │    │  │ (Intent +  │  │ (Professional │  │
│  • ComplaintStatus     │    │  │  Category) │  │  Email Text)  │  │
│  • User (Google OAuth) │    │  └────────────┘  └───────────────┘  │
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

### 🔐 Google OAuth 2.0 Authentication *(New — Today)*
| Feature | Description |
|---------|-------------|
| **Official Google Account Chooser** | Clicking "Continue with Google" opens the real Google account selector popup with all logged-in Gmail accounts |
| **Verified Identity Binding** | Each account is bound to a verified `@gmail.com` identity — preventing bot registrations and fake accounts |
| **Auto Account Creation** | New Google users are automatically registered in the database with name, email, and a generated JWT token pair |
| **JWT Token Issuance** | Django backend issues `access_token` + `refresh_token` via SimpleJWT on every successful Google OAuth sign-in |
| **Anti-Spam Vote Protection** | Google-verified citizen identity enforces 1-vote-per-ward-project constraint at database level (`unique_together`) |
| **Seamless Dashboard Redirect** | After Google sign-in, React AuthContext instantly loads user state and redirects to `/dashboard` |

### 💰 Participatory Civic Budgeting & Ward Projects *(S36 Core Feature)*
| Feature | Description |
|---------|-------------|
| **₹5 Crore District Repair Pool** | Visual budget tracker showing ₹1.45 Cr spent, ₹3.55 Cr remaining, and ₹6.5 Lakh backlog from live grievance data |
| **AI Auto-Clustering Engine** | Groups all active complaints in the same `(district, category)` cluster into a single **Civic Infrastructure Project** proposal |
| **Dynamic AI Cost Estimator** | Calculates project repair costs dynamically: Roads ₹4.5L, Potholes ₹1.25L, Electrical ₹85K, Water ₹55K, Sanitation ₹22K |
| **Citizen Democratic Voting** | Citizens click "🗳️ Vote to Fund" to push high-priority projects to the top of the municipal funding queue |
| **ACID Vote Toggle** | `get_or_create` atomic DB pattern with `UniqueConstraint(["project", "user"])` prevents duplicate vote injection |
| **Multi-Attribute Filters** | Filter ward projects by **State**, **District**, **Department**, and **Category** — via dedicated `/civic-budgeting` portal |
| **Real-Time Vote Counter** | Vote count updates instantly on screen without page reload via React optimistic state update |
| **Cascade Status Machine** | Project transitions: `PROPOSED` → `IN_EXECUTION` → `COMPLETED` as votes accumulate and budget is allocated |

### 📸 Officer Proof Upload & Citizen Verification Ledger *(Enhanced — Today)*
| Feature | Description |
|---------|-------------|
| **Gallery Image Upload Fixed** | Officer can now pick ANY custom photo from their device gallery — exact file is sent via `multipart/form-data` to `request.FILES` |
| **Instant Cache Update** | `queryClient.setQueryData(['complaints', id], res.data.data)` immediately renders the uploaded photo without page refresh |
| **Before / After Side-by-Side** | Citizen's original complaint photo vs officer's uploaded repair proof displayed side-by-side |
| **Citizen Verification Flow** | Ticket moves to `PENDING_VERIFICATION` → community ledger → `VERIFIED_RESOLVED` only after citizen clicks "✅ Verify Work Done" |
| **Anti-Spam Rejection** | "❌ Reject Proof (Spam/Unresolved)" instantly re-opens the ticket to `IN_PROGRESS`, flagging the officer |

### 🤖 AI-Powered Grievance Assistant (Aavedan Saathi)
| Feature | Description |
|---------|-------------|
| **Conversational Filing** | Citizens describe issues in natural language (e.g., *"There's a huge pothole near the bus stop in Khurda"*) |
| **Intent Classification** | Multi-layered pipeline detects intent: `FILE_COMPLAINT`, `CHECK_STATUS`, `ASK_SCHEME`, `GREETING`, or `GENERAL_QUERY` |
| **Smart Entity Extraction** | AI extracts complaint type, category, department, state, district, and urgency from unstructured text |
| **Professional Draft Generation** | Raw citizen text → formal, professional grievance letter via Gemini LLM |
| **Dual Submission Options** | **Option 1:** AI auto-dispatches official email · **Option 2:** Handoff to manual form for image uploads |
| **Session Memory** | Stateful conversations across multiple messages with entity accumulation |
| **Resilient Fallback** | When Gemini API is rate-limited (429/503), the local rules-based engine takes over seamlessly |

### 📧 Official Email Dispatch System
| Feature | Description |
|---------|-------------|
| **Office Lookup** | Finds the correct department office email based on citizen's district + state + department |
| **Inline Image Embedding** | Evidence photos embedded directly in email body via `Content-ID` (`cid:evidence_X`), not as attachments |
| **Anonymous Dispatch** | Citizens can file anonymously — their name/email is replaced with *"Anonymous Citizen"* and receipt goes via BCC |
| **Email Preview Modal** | Full-screen preview of the email before sending, with copy-to-clipboard and official portal link |

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

### 🔎 Advanced Multi-Dimensional Filtering
| Feature | Description |
|---------|-------------|
| **6 Filter Dimensions** | Filter by **Status**, **Priority**, **Category**, **Department**, **State**, and **District** |
| **Dynamic Metadata** | All filter dropdown options are loaded live from the database (not hardcoded) |
| **Cascading Location** | Selecting a State dynamically loads its Districts |
| **URL Persistence** | Active filters are synced to URL search parameters for shareable, bookmarkable filtered views |

### 📊 Dashboard & Analytics
| Feature | Description |
|---------|-------------|
| **Statistics Cards** | Total, pending, in-progress, and resolved complaint counts with animated counters |
| **Monthly Trends** | Line chart showing complaint volume over time |
| **Department Distribution** | Pie/doughnut chart breaking down complaints by department |
| **Quick Link to Budgeting** | Direct access button to the `/civic-budgeting` portal from the main dashboard |

### 🎓 Welfare Scheme Recommendation Engine
| Feature | Description |
|---------|-------------|
| **AI-Powered Matching** | Gemini LLM evaluates eligibility against 100+ schemes using income, age, caste, education, and state |
| **Residency Enforcement** | Region-locked schemes (e.g., Odisha-only yojanas) are flagged when user is from another state |
| **Fuzzy Fallback Search** | Typo-tolerant keyword matching when LLM is unavailable |

### 🌐 Multi-Language Support (22 Languages)
| Feature | Description |
|---------|-------------|
| **Google Translate Integration** | Full-page translation supporting **12 Indian regional languages** + **7 international languages** |
| **Searchable Language Selector** | Custom dropdown with real-time language search and `localStorage` persistence |
| **React DOM Crash Protection** | Inline monkey-patch prevents React white-screen crashes caused by Google Translate DOM mutations |

### 🗣️ Voice Input & Speech Recognition
| Feature | Description |
|---------|-------------|
| **Voice Complaint Dictation** | Hands-free speech-to-text on the manual complaint form |
| **Multi-Locale Voice Input** | Auto-detects site language and switches speech recognition locale (`hi-IN`, `or-IN`, `bn-IN`, etc.) |
| **Voice Navigation Commands** | Saying *"show schemes"* navigates to schemes page; *"file complaint"* navigates to the complaint form |

### 🎨 Premium UI/UX
| Feature | Description |
|---------|-------------|
| **Glassmorphism Design** | Frosted glass cards with backdrop blur and layered depth |
| **Micro-Animations** | Framer Motion page transitions, card stagger effects, skeleton loaders |
| **Interactive Map** | Leaflet coordinate picker for precise grievance geolocation |
| **Responsive Layout** | Mobile-first design that scales beautifully from phone to desktop |

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
| `@react-oauth/google` | Official Google OAuth 2.0 Account Chooser |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Premium animations & transitions |
| Chart.js + React-Chartjs-2 | Dashboard analytics charts |
| Leaflet + React-Leaflet | Interactive maps & coordinate picking |
| React Toastify | Notification toasts |
| React Hook Form | Form state management with validation |

### Backend (Django DRF)
| Technology | Purpose |
|-----------|---------|
| Django 5.x | Web framework |
| Django REST Framework | REST API layer |
| SimpleJWT | JWT authentication |
| `google-auth` | Google OAuth 2.0 ID token verification |
| django-filters | Advanced queryset filtering |
| PostgreSQL / SQLite | Production / development database |
| SMTP (Django mail) | Email dispatch with inline attachments |

### AI Microservice (FastAPI)
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async API framework |
| Uvicorn | ASGI server |
| Google GenAI SDK | Gemini LLM client |
| Pydantic v2 | Strict request/response validation |

---

## 📂 Project Structure

```
Aavedan-Setu/
├── backend/                       # Django DRF Core Backend
│   ├── accounts/                  # User auth, Google OAuth, JWT, profiles
│   │   ├── views.py               # RegisterView, LoginView, GoogleAuthView
│   │   └── urls.py                # /register/, /login/, /google/ endpoints
│   ├── complaints/                # Grievance CRUD, filtering, civic budgeting
│   │   ├── models.py              # Complaint, CivicProject, CivicProjectVote, DepartmentBudget
│   │   ├── views.py               # ComplaintListView, OfficerResolveView, CitizenVerifyView,
│   │   │                          # CivicProjectListView, CivicProjectVoteView, BudgetAnalyticsView
│   │   ├── filters.py             # Multi-field filterset (status, priority, category, dept, location)
│   │   └── serializers.py         # List, Detail, Create serializers with anonymous masking
│   ├── departments/               # Government departments registry
│   ├── categories/                # Complaint categories & types
│   ├── locations/                 # Indian states & districts (36 states, 700+ districts)
│   ├── schemes/                   # Welfare schemes database & eligibility rules
│   ├── ai/                        # AI orchestrator, session memory, email dispatcher
│   │   └── services/
│   │       ├── orchestrator.py    # Intent detection → entity extraction → response generation
│   │       ├── memory.py          # In-memory session state manager
│   │       └── email_dispatcher.py # Office lookup, email compilation, anonymous routing
│   ├── seed_all.py                # One-command database seeder
│   └── manage.py
│
├── Ai/                            # FastAPI AI Microservice
│   ├── app/
│   │   ├── api/routers/           # /classify, /draft, /recommend, /translate endpoints
│   │   ├── llm/                   # Gemini client with retry policies & JSON parsing
│   │   └── main.py                # FastAPI app entrypoint
│   └── requirements.txt
│
├── frontend/                      # React 19 Citizen Portal
│   ├── .env                       # VITE_GOOGLE_CLIENT_ID (Google OAuth Client ID)
│   ├── src/
│   │   ├── main.jsx               # GoogleOAuthProvider wrapper
│   │   ├── components/
│   │   │   └── layout/            # Sidebar (with Civic Budgeting link), Navbar, FloatingAIAssistant
│   │   ├── context/               # AuthContext (JWT + loginWithTokens for Google OAuth)
│   │   ├── pages/
│   │   │   ├── Dashboard/         # Analytics dashboard + Civic Budgeting quick link
│   │   │   ├── Complaint/         # CreateComplaint, ComplaintList, ComplaintDetail
│   │   │   │                      #  └── OfficerResolvePanel (multipart/form-data gallery upload)
│   │   │   │                      #  └── CitizenVerificationLedger (Verify / Reject Proof)
│   │   │   ├── Budgeting/         # CivicBudgeting.jsx — Ward Projects + Vote to Fund portal
│   │   │   ├── Schemes/           # SchemeList, SchemeDetail
│   │   │   └── Login/             # Login.jsx (Google OAuth Account Chooser, JWT login, OTP)
│   │   └── services/              # Axios API service wrappers
│   └── vite.config.js             # Dev server proxy to Django backend
│
├── thery.md                       # SIH 2026 Presentation Script & Technical Defense Guide
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ (npm)**
- **PostgreSQL 15+** *(optional — falls back to SQLite)*
- **Google Gemini API Key** *(free tier available at [ai.google.dev](https://ai.google.dev/))*
- **Google OAuth Client ID** *(free at [Google Cloud Console](https://console.cloud.google.com/apis/credentials))*

---

### 1️⃣ Backend Setup (Django REST Framework)

```bash
cd gov_complaint_schemes

python -m venv myenv
myenv\Scripts\activate           # Windows
# source myenv/bin/activate      # Linux/macOS

pip install -r requirements.txt
pip install google-auth requests  # For Google OAuth verification

cd backend
python manage.py makemigrations
python manage.py migrate

python seed_all.py
python manage.py createsuperuser
python manage.py runserver
# → http://127.0.0.1:8000/
```

---

### 2️⃣ AI Microservice Setup (FastAPI)

```bash
cd ../Ai
pip install -r requirements.txt

# Create Ai/.env with:
#   GEMINI_API_KEY=your_gemini_api_key_here
#   GEMINI_MODEL_NAME=gemini-flash-latest

python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
# → http://127.0.0.1:8010/
```

---

### 3️⃣ Frontend Setup (React 19 + Vite)

```bash
cd ../frontend

npm install

# Create frontend/.env with:
#   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

npm run dev
# → http://localhost:5173/
```

#### Google OAuth Setup (for "Sign in with Google")
1. Open [Google Cloud Credentials Console](https://console.cloud.google.com/apis/credentials)
2. Create **OAuth 2.0 Client ID** → Web Application
3. Authorized JavaScript origins: `http://localhost:5173`
4. Authorized redirect URIs: `http://localhost:5173`, `http://localhost:5173/login`
5. Copy Client ID → paste in `frontend/.env` as `VITE_GOOGLE_CLIENT_ID=...`

---

## 📊 Database Seeding

```bash
cd backend
python seed_all.py
```

| Seeder | Data |
|--------|------|
| `seed_categories.py` | 6 complaint categories |
| `seed_departments.py` | Corresponding government departments |
| `seed_locations.py` | 36 Indian states/UTs with 700+ districts |
| `seed_knowledge.py` | Department office directory with contact emails |
| `seed_schemes.py` | 100+ welfare schemes with eligibility criteria |

---

## 🔐 API Reference

### Auth Module — `/api/auth/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Create a citizen account |
| `POST` | `/api/auth/login/` | Login and receive JWT tokens |
| `POST` | `/api/auth/google/` | **Google OAuth 2.0** — verify Google ID token, issue JWT |
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
| `POST` | `/api/complaints/{id}/support/` | Toggle upvote/support |
| `POST` | `/api/complaints/{id}/officer-resolve/` | **Upload geotagged "After Repair" proof photo** |
| `POST` | `/api/complaints/{id}/citizen-verify/` | **Citizen verifies or rejects officer proof** |
| `POST` | `/api/complaints/check-duplicate/` | Check for existing similar complaints |

### Civic Budgeting Module — `/api/complaints/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/complaints/projects/` | **List auto-clustered Ward Civic Projects** |
| `POST` | `/api/complaints/projects/{id}/vote/` | **Toggle citizen "Vote to Fund" on a project** |
| `GET` | `/api/complaints/budget-analytics/` | **District budget pool, spent, remaining, backlog** |

### AI Assistant Module — `/api/ai/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat/` | Conversational chat with Aavedan Saathi |
| `POST` | `/api/ai/chat/email-preview/` | Generate email preview with draft description |
| `POST` | `/api/ai/chat/send-email/` | Dispatch official grievance email to department |
| `POST` | `/api/ai/recommend-schemes/` | AI-powered welfare scheme recommendations |

---

## 🔄 Core Workflows

### 1. Google OAuth 2.0 Sign-In Flow *(New — Today)*

```
[Citizen clicks "Continue with Google" on Login Page]
       │
       ▼
[Official Google Account Chooser Popup opens]
(shows all logged-in @gmail.com accounts)
       │ Citizen selects their account
       ▼
[React fetches verified name + email from Google userinfo API]
       │
       ▼
[React POSTs to POST /api/auth/google/ with {email, full_name}]
       │
       ▼
[Django GoogleAuthView: get_or_create User in DB, issue JWT]
       │
       ▼
[loginWithTokens(access, refresh, user) updates AuthContext]
       │
       ▼
[Toast: "Welcome, Pratham! Signed in with pratham6306@gmail.com"]
[Redirect → /dashboard]
```

### 2. Citizen Vote to Fund (Participatory Budgeting) Flow *(New — Today)*

```
[1. AI Clusters 11 Road complaints in Madhepura → CivicProject created]
       │
       ▼
[2. Citizen opens /civic-budgeting → Filters by District: Madhepura]
       │
       ▼
[3. Citizen clicks "🗳️ Vote to Fund" on Road & Infrastructure Project]
       │  POST /api/complaints/projects/<id>/vote/
       ▼
[4. Django: get_or_create CivicProjectVote(project, user)]
   (UniqueConstraint guarantees 1 vote per user per project)
       │
       ▼
[5. Vote count increments instantly on screen]
[6. When threshold reached → Status: PROPOSED → IN_EXECUTION]
[7. Budget allocated → All 11 complaints receive "In Progress" status]
```

### 3. Officer Proof Upload & Citizen Verification Flow *(Fixed — Today)*

```
[Officer opens any /complaints/:id page]
       │ Clicks "👮 Switch to Officer Mode (Demo)"
       ▼
[Selects custom photo from device gallery]
       │  POST /api/complaints/:id/officer-resolve/
       │  Content-Type: multipart/form-data
       ▼
[Django saves exact gallery file to complaint.after_image]
[Status → PENDING_VERIFICATION]
       │
       ▼
[queryClient.setQueryData instantly updates React UI]
[Before/After photos appear side-by-side]
       │
       ▼
[Citizen clicks "✅ Verify Work Done" → Status: VERIFIED_RESOLVED]
[OR clicks "❌ Reject Proof" → Status: IN_PROGRESS (re-opened)]
```

---

## 🏗️ Problem Statement Alignment

### SIH S36: Civic Grievance Triage and Participatory Budgeting
> *"Build an AI-powered platform for civic grievance classification, prioritization, and community-driven triage."*

✅ AI-powered complaint classification with Gemini LLM  
✅ Community upvoting system for collective prioritization  
✅ **Participatory Civic Budgeting Portal** with ₹5 Crore District Repair Pool  
✅ **AI Auto-Clustering** of complaints into Ward Civic Infrastructure Projects  
✅ **Citizen Vote to Fund** — democratic municipal capital allocation  
✅ **Officer Proof Upload + Citizen Verification Ledger** — evidence-grounded resolution  
✅ Fuzzy duplicate detection to prevent redundant filings  
✅ Multi-dimensional filtering (status, priority, category, department, location)  
✅ Multi-language support (22 languages) with Google Translate integration  
✅ Hindi, Hinglish & Devanagari intent detection (zero-LLM offline capable)  

### SIH S1: Human-in-the-Loop Agentic AI
> *"Create an agentic AI system where humans remain in control of critical decisions."*

✅ **Google OAuth 2.0** — verified citizen identity, no fake accounts  
✅ AI suggests — Human approves (email preview before dispatch)  
✅ Dual submission paths (AI auto-dispatch OR manual form completion)  
✅ Citizens can override AI-inferred categories and departments  
✅ Anonymous filing option gives citizens control over privacy  
✅ Resilient hybrid architecture: LLM + local rules-based fallback  
✅ Voice input & speech recognition for hands-free complaint filing in 12+ Indian languages  
✅ **Citizens control resolution** — Verify or Reject officer proof photos  

---

## 👥 Team

**Aavedan-Setu** — SIH 2026

---

<div align="center">

*Built with ❤️ for Digital India 🇮🇳*

**Empowering citizens. Bridging governance. One complaint at a time.**

</div>
