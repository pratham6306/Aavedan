# 🏛️ Aavedan Setu — AI-Powered Civic Grievance Triage & Resolution Platform

<div align="center">

**SIH 2026 · Problem Statements S36 & S1**

*An intelligent, Human-in-the-Loop Agentic AI system that empowers citizens to file, track, and resolve public grievances through conversational AI — with community-driven participatory budgeting, weighted priority scoring, smart duplicate detection, Google OAuth 2.0, and automated official email dispatching.*

[![Django](https://img.shields.io/badge/Django-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Groq Cloud](https://img.shields.io/badge/Groq_Cloud-LLM-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-Backup-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Google OAuth](https://img.shields.io/badge/Google_OAuth-2.0-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/identity)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🌟 What is Aavedan Setu?

**Aavedan Setu** (आवेदन सेतु — *"Bridge of Applications"*) is an enterprise-grade citizen empowerment platform that bridges the gap between citizens and government departments. It combines:

- 🤖 **Aavedan Saathi** — A conversational AI assistant powered by Groq Cloud (Qwen 3.6-27B) + Google Gemini with automatic failover, guiding citizens through grievance filing in natural language
- 🌐 **Multi-Lingual NLP Engine** — Understands complaints in English, Hindi, Hinglish, Odia, and 20+ Indian languages with zero-keyword LLM intelligence
- 📧 **Automated Official Email Dispatch** — AI-drafted, professionally formatted grievance emails sent directly to the correct department office
- 🗳️ **Community Upvoting** — Citizens can support each other's complaints to drive collective prioritization
- 🔍 **Smart Duplicate Detection** — Prevents redundant filings by detecting similar complaints using fuzzy category + location matching
- 🔒 **Anonymous Filing** — Citizens can hide their identity from authorities while still receiving tracking receipts
- 📊 **Welfare Scheme Recommendations** — AI-powered eligibility matching for 100+ government welfare schemes across Indian states
- 💰 **Participatory Civic Budgeting** — Fixed engineering base costs with a weighted 100-point Priority Score algorithm (40% Severity + 35% Demand + 25% Votes) and real-time district priority percentage allocation
- 🔑 **Google OAuth 2.0** — One-click Sign In with Google with official account chooser popup, zero-friction citizen onboarding
- 📸 **Geotagged Proof Resolution Ledger** — Officers upload geotagged "After Repair" proof; citizens verify or reject via a community ledger
- 📍 **Smart Location Intelligence** — Fuzzy district name matching (typo-tolerant), inline location extraction from free-text, GPS auto-detection, and all 36 Indian States & UTs with full district coverage

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
│  │ Google   │  │ (CRUD+Filter)│  │ (LLM-First)  │  │ (Search)  │ │
│  │ OAuth    │  └──────────────┘  └──────────────┘  └───────────┘ │
│  └──────────┘  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│                │ CivicProject │  │ Priority     │  │ Budget    │ │
│                │ Vote + Score │  │ Score Engine │  │ Analytics │ │
│                └──────────────┘  └──────────────┘  └───────────┘ │
└───────────┬───────────────────────────────┬────────────────────────┘
            │ Read/Write                    │ JSON API Calls
            ▼                               ▼
┌────────────────────────┐    ┌──────────────────────────────────────┐
│   PostgreSQL/SQLite DB │    │     FASTAPI AI MICROSERVICE          │
│                        │    │           (Port 8010)                 │
│  • States & Districts  │    │                                      │
│  • CivicProject Models │    │  ┌────────────┐  ┌───────────────┐  │
│  • Priority Score      │    │  │ Classify   │  │ Draft         │  │
│  • DepartmentBudget    │    │  │ (Intent +  │  │ (Professional │  │
│  • ComplaintStatus     │    │  │  Category) │  │  Email Text)  │  │
│  • User (Google OAuth) │    │  └────────────┘  └───────────────┘  │
└────────────────────────┘    └──────────────┬───────────────────────┘
                                             │ Groq Cloud → Gemini → Offline
                                             ▼
                              ┌──────────────────────────────────────┐
                              │    Groq Cloud (Qwen 3.6-27B)         │
                              │    → Gemini Flash (Backup)           │
                              │    → KnowledgeRetriever (Offline)    │
                              └──────────────────────────────────────┘
```

---

## 🔑 Key Features

### 🧠 Multi-Provider LLM Engine with Instant Failover
| Feature | Description |
|---------|-------------|
| **Groq Cloud Primary** | `qwen/qwen3.6-27b` via Groq Cloud API — ultra-fast inference at 500+ tokens/sec |
| **Multi-Key Gemini Backup** | 5-key rotation pool for Google Gemini Flash as secondary LLM provider |
| **Instant HTTP 429 Failover** | When Groq daily token quota (100K TPD) is exhausted, system instantly falls back to Gemini — zero downtime |
| **Offline KnowledgeRetriever** | 74 regex-based sub-issue rules engine with exact categories, departments, priorities & costs — works with zero API connectivity |
| **3-Tier Cascade** | `Groq Cloud → Gemini Flash → Offline Engine` — guarantees 100% availability regardless of API status |

### 🌐 Multi-Lingual NLP & Hinglish Intelligence
| Feature | Description |
|---------|-------------|
| **LLM-First Routing** | Every chatbox message is sent to the LLM first for classification — works in any language the LLM understands (English, Hindi, Odia, Tamil, Bengali, etc.) |
| **Hinglish Intent Detection** | Offline regex patterns for Hinglish verbs: `kutte`, `kutta`, `paani`, `bijli`, `sadak`, `naali`, `jal`, `rha/rhi`, `nhi/nahi` |
| **Devanagari Transliteration** | Offline Devanagari-to-English mapping for fuzzy form-filling category matching |
| **Hindi Vocabulary Mapping** | 50+ Hindi keyword→English mappings in `KnowledgeRetriever` for offline sub-issue resolution |
| **Zero-Keyword Classification** | No hardcoded keywords needed — the LLM natively understands `"more ghare pani asuni"` (Odia) and classifies it as Water Supply |

### 📍 Smart Location Intelligence
| Feature | Description |
|---------|-------------|
| **Inline Location Extraction** | Typing `"street light issue in madhepura bihar"` auto-extracts State: Bihar, District: Madhepura from free-text |
| **Fuzzy District Matching** | `difflib` 70%+ similarity matching corrects typos: `madhepurii → Madhepura`, `purniya → Purnia`, `cutack → Cuttack` |
| **Civic Stop-Word Filtering** | Common complaint words (`water`, `issue`, `street`, `light`, `road`) are excluded from fuzzy matching to prevent false positives |
| **GPS Auto-Detection** | `navigator.geolocation` + OpenStreetMap reverse geocoding instantly fills State & District from citizen's device GPS |
| **All 36 States & UTs** | Complete dropdown coverage: 28 States + 8 Union Territories with full district lists |
| **Full District Coverage** | Bihar (38 districts), Odisha (30 districts), Jharkhand (24 districts) — all official districts included |
| **Dynamic API + Fallback** | Backend API districts merged with comprehensive offline dictionary — works even when backend is unreachable |
| **Structured Key-Value Parsing** | `"State: Bihar, District: Madhepura"` from chat location widget is parsed and validated against DB |

### 🔐 Google OAuth 2.0 Authentication
| Feature | Description |
|---------|-------------|
| **Official Google Account Chooser** | Clicking "Continue with Google" opens the real Google account selector popup with all logged-in Gmail accounts |
| **Verified Identity Binding** | Each account is bound to a verified `@gmail.com` identity — preventing bot registrations and fake accounts |
| **Auto Account Creation** | New Google users are automatically registered in the database with name, email, and a generated JWT token pair |
| **JWT Token Issuance** | Django backend issues `access_token` + `refresh_token` via SimpleJWT on every successful Google OAuth sign-in |
| **Anti-Spam Vote Protection** | Google-verified citizen identity enforces 1-vote-per-ward-project constraint at database level (`unique_together`) |
| **Seamless Dashboard Redirect** | After Google sign-in, React AuthContext instantly loads user state and redirects to `/dashboard` |

### 💰 Participatory Civic Budgeting & Priority Scoring *(S36 Core Feature)*
| Feature | Description |
|---------|-------------|
| **Fixed Engineering Base Costs** | Project budgets use the exact sub-issue repair cost from `KnowledgeRetriever` (e.g. ₹25K Street Light, ₹85K Drainage) — zero artificial inflation |
| **100-Point Priority Score Formula** | `Priority Score = (40% × Severity) + (35% × Demand Score) + (25% × Vote Score)` — out of 100 |
| **Severity Scoring (40%)** | `CRITICAL` = 100, `HIGH` = 75, `MEDIUM` = 50, `LOW` = 25 — safety hazards always rank highest |
| **Demand Score (35%)** | `(Complaints R + Upvotes L) / Max Demand in District × 100` — measures public urgency |
| **Vote Score (25%)** | `(Direct Project Votes V) / Max Votes in District × 100` — democratic citizen allocation |
| **District Priority Share (%)** | Real-time relative percentage: `Project Score / Σ All District Scores × 100` — sums to 100% per district |
| **Real-Time Recalculation** | Every vote, upvote, and new complaint triggers live recalculation of all priority scores and percentages |
| **Priority Score Badge** | Color-coded badge: 🔴 Red (80+ Critical), 🟡 Amber (60+ High), 🔵 Indigo (<60 Medium) |
| **District Priority Progress Bar** | Visual gradient progress bar showing each project's allocation weight within its district |
| **AI Auto-Clustering Engine** | Groups complaints by `(district, category, sub_issue)` using strict 3-tier rules: ≥3 tickets, or 2+2 upvotes, or 1+3 upvotes |
| **74 Sub-Issue Cluster Types** | Dedicated cluster types across 10 municipal sectors with exact budgets, departments, and priority rules |
| **Anti-Bias Guarantee** | A ₹5,000 pothole with 20 upvotes ranks below a ₹50,000 road collapse with 2 upvotes if severity is higher |

### 📸 Officer Proof Upload & Citizen Verification Ledger
| Feature | Description |
|---------|-------------|
| **Gallery Image Upload** | Officer can pick ANY custom photo from their device gallery — exact file sent via `multipart/form-data` |
| **Instant Cache Update** | `queryClient.setQueryData` immediately renders the uploaded photo without page refresh |
| **Before / After Side-by-Side** | Citizen's original complaint photo vs officer's uploaded repair proof displayed side-by-side |
| **Citizen Verification Flow** | Ticket: `PENDING_VERIFICATION` → community ledger → `VERIFIED_RESOLVED` only after citizen clicks "✅ Verify Work Done" |
| **Anti-Spam Rejection** | "❌ Reject Proof (Spam/Unresolved)" instantly re-opens the ticket to `IN_PROGRESS`, flagging the officer |

### 🤖 AI-Powered Grievance Assistant (Aavedan Saathi)
| Feature | Description |
|---------|-------------|
| **Conversational Filing** | Citizens describe issues in natural language — any language the LLM understands |
| **LLM-First Classification** | Every chatbox message goes to the LLM first; if it identifies a civic category, intent auto-upgrades to `FILE_COMPLAINT` |
| **Unified Routing** | Description box (AI Assist) and AI Chatbox now use identical LLM-first routing — zero divergence |
| **Intent Classification** | Multi-layered pipeline: `FILE_COMPLAINT`, `CHECK_STATUS`, `ASK_SCHEME`, `GREETING`, `GENERAL_QUERY` |
| **74 Sub-Issue Knowledge Base** | Exact regex rules for 74 civic sub-issues with categories, departments, priorities & cost estimates |
| **Professional Draft Generation** | Raw citizen text → formal, professional grievance letter via LLM |
| **Dual Submission Options** | **Option 1:** AI auto-dispatches official email · **Option 2:** Handoff to manual form for image uploads |
| **Session Memory** | Stateful conversations across multiple messages with entity accumulation |
| **Clean Clarification Prompt** | When AI can't classify, it returns a polite 1-paragraph prompt without hardcoded examples |
| **Resilient 3-Tier Fallback** | `Groq Cloud → Gemini Flash → Offline KnowledgeRetriever` — zero downtime |

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
| **AI-Powered Matching** | LLM evaluates eligibility against 100+ schemes using income, age, caste, education, and state |
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
| **Voice Complaint Dictation** | Hands-free speech-to-text on the manual complaint form and AI chatbox |
| **Multi-Locale Voice Input** | Auto-detects site language and switches speech recognition locale (`hi-IN`, `or-IN`, `bn-IN`, etc.) |
| **Voice Navigation Commands** | Saying *"show schemes"* navigates to schemes page; *"file complaint"* navigates to the complaint form |

### 🎨 Premium UI/UX
| Feature | Description |
|---------|-------------|
| **Glassmorphism Design** | Frosted glass cards with backdrop blur and layered depth |
| **Micro-Animations** | Framer Motion page transitions, card stagger effects, skeleton loaders |
| **Interactive Map** | Leaflet coordinate picker for precise grievance geolocation |
| **Responsive Layout** | Mobile-first design that scales beautifully from phone to desktop |
| **Chat Location Widget** | Dual-option location selector: GPS auto-detect + State/District dropdown with all 36 States & UTs |

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
| `difflib` | Fuzzy district name matching for typo correction |

### AI Microservice (FastAPI)
| Technology | Purpose |
|-----------|---------|
| FastAPI | Async API framework |
| Uvicorn | ASGI server |
| Groq Cloud API (`httpx`) | Primary LLM — Qwen 3.6-27B at 500+ tok/s |
| Google GenAI SDK | Backup LLM — Gemini Flash |
| Multi-Key Rotation | 5-key Gemini pool for rate-limit resilience |
| Pydantic v2 | Strict request/response validation |
| `pytest` (44 tests) | Full unit test suite for AI classification |

---

## 📂 Project Structure

```
Aavedan-Setu/
├── backend/                       # Django DRF Core Backend
│   ├── accounts/                  # User auth, Google OAuth, JWT, profiles
│   │   ├── views.py               # RegisterView, LoginView, GoogleAuthView
│   │   └── urls.py                # /register/, /login/, /google/ endpoints
│   ├── complaints/                # Grievance CRUD, filtering, civic budgeting
│   │   ├── models.py              # Complaint, CivicProject (priority_score, priority_percentage),
│   │   │                          #   CivicProjectVote, DepartmentBudget
│   │   ├── views.py               # ComplaintListView, OfficerResolveView, CitizenVerifyView,
│   │   │                          # CivicProjectListView (Priority Score Engine),
│   │   │                          # CivicProjectVoteView, BudgetAnalyticsView
│   │   ├── filters.py             # Multi-field filterset (status, priority, category, dept, location)
│   │   └── serializers.py         # List, Detail, Create serializers with priority_score fields
│   ├── departments/               # Government departments registry
│   ├── categories/                # Complaint categories & types
│   ├── locations/                 # Indian states & districts (36 states, 700+ districts)
│   ├── schemes/                   # Welfare schemes database & eligibility rules
│   ├── ai/                        # AI orchestrator, session memory, email dispatcher
│   │   └── services/
│   │       ├── orchestrator.py    # LLM-first routing → location extraction → entity resolution
│   │       ├── complaint_analyzer.py # LLM + KnowledgeRetriever merger with 74 sub-issue rules
│   │       ├── knowledge_retriever.py # 74 regex sub-issue rules with Hindi vocabulary mapping
│   │       ├── intent_detector.py # Hinglish/Hindi/Devanagari intent patterns
│   │       ├── location_extractor.py # Fuzzy difflib district matching + inline extraction
│   │       ├── memory.py          # In-memory session state manager
│   │       └── email_dispatcher.py # Office lookup, email compilation, anonymous routing
│   ├── seed_all.py                # One-command database seeder
│   └── manage.py
│
├── Ai/                            # FastAPI AI Microservice
│   ├── app/
│   │   ├── api/routers/           # /classify, /draft, /recommend, /translate endpoints
│   │   ├── llm/
│   │   │   └── gemini_client.py   # Groq Cloud primary + Gemini backup + HTTP 429 failover
│   │   ├── knowledge/
│   │   │   └── priority_rules.yaml # Per-category priority rules (STREETLIGHT: high, etc.)
│   │   ├── tests/                 # 44 unit tests (pytest) for classification, knowledge, config
│   │   └── main.py                # FastAPI app entrypoint
│   ├── .env                       # GROQ_API_KEY, GROQ_MODEL, GEMINI_API_KEYS (5-key rotation)
│   └── requirements.txt
│
├── frontend/                      # React 19 Citizen Portal
│   ├── .env                       # VITE_GOOGLE_CLIENT_ID (Google OAuth Client ID)
│   ├── src/
│   │   ├── main.jsx               # GoogleOAuthProvider wrapper
│   │   ├── components/
│   │   │   └── layout/
│   │   │       ├── FloatingAIAssistant.jsx  # AI Chat + ChatLocationWidget (36 States, GPS, full districts)
│   │   │       ├── GoogleTranslate.jsx      # 22-language translation widget
│   │   │       ├── LanguageTranslator.jsx   # Searchable language selector
│   │   │       ├── Navbar.jsx               # Top navigation with notification bell
│   │   │       └── Sidebar.jsx              # Sidebar with Civic Budgeting link
│   │   ├── context/               # AuthContext (JWT + loginWithTokens for Google OAuth)
│   │   ├── pages/
│   │   │   ├── Dashboard/         # Analytics dashboard + Civic Budgeting quick link
│   │   │   ├── Complaint/         # CreateComplaint (AI Assist + Voice + Devanagari fuzzy match)
│   │   │   │                      #  └── OfficerResolvePanel (multipart/form-data gallery upload)
│   │   │   │                      #  └── CitizenVerificationLedger (Verify / Reject Proof)
│   │   │   ├── Budgeting/         # CivicBudgeting.jsx — Priority Score badges + % progress bars
│   │   │   ├── GovernmentSchemes/ # SchemeList, SchemeDetail
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
- **Groq Cloud API Key** *(free at [console.groq.com](https://console.groq.com/))*
- **Google Gemini API Key** *(backup — free at [ai.google.dev](https://ai.google.dev/))*
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
#   GROQ_API_KEY=your_groq_api_key_here
#   GROQ_MODEL=qwen/qwen3.6-27b
#   GEMINI_API_KEYS=key1,key2,key3,key4,key5
#   GEMINI_API_KEY=key1
#   GEMINI_MODEL_NAME=gemini-flash-latest

python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
# → http://127.0.0.1:8010/

# Run tests:
python -m pytest app/tests/    # 44 tests, ~1s
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
| `GET` | `/api/complaints/projects/` | **List auto-clustered Ward Civic Projects** (sorted by priority_score) |
| `POST` | `/api/complaints/projects/{id}/vote/` | **Toggle citizen "Vote to Fund" on a project** |
| `GET` | `/api/complaints/budget-analytics/` | **District budget pool, spent, remaining, backlog** |

### Location Module — `/api/locations/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/locations/states/` | List all 36 Indian States & UTs |
| `GET` | `/api/locations/districts/?state=Bihar` | List districts filtered by state name or ID |

### AI Assistant Module — `/api/ai/`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/chat/` | Conversational chat with Aavedan Saathi (LLM-first routing) |
| `POST` | `/api/ai/chat/email-preview/` | Generate email preview with draft description |
| `POST` | `/api/ai/chat/send-email/` | Dispatch official grievance email to department |
| `POST` | `/api/ai/recommend-schemes/` | AI-powered welfare scheme recommendations |

---

## 🔄 Core Workflows

### 1. AI Grievance Filing Flow (LLM-First Multi-Lingual)

```
[Citizen types "more ghare pani asuni" (Odia) or "street light issue in madhepura bihar"]
       │
       ▼
[1. Location Extraction (FIRST)]
    → Fuzzy difflib matching: "madhepurii" → "Madhepura"
    → State auto-resolved: "Bihar"
       │
       ▼
[2. LLM Classification (Groq Cloud → Gemini → Offline)]
    → Category: "Water Supply Issue" / "Street Light"
    → Department: "Water Supply Board" / "Electricity Board"
    → Intent auto-upgraded to FILE_COMPLAINT
       │
       ▼
[3. Missing Fields Check]
    → State ✅ (extracted), District ✅ (extracted)
    → Missing: Address → ASK_ADDRESS
       │
       ▼
[4. Citizen provides address → CONFIRM_AND_FILE]
    → Option 1: AI dispatches official email
    → Option 2: Handoff to manual form
```

### 2. Priority Score Calculation & Civic Budgeting Flow

```
[AI clusters 11 Road complaints in Madhepura → CivicProject created]
       │
       ▼
[Priority Score = (40% × Severity) + (35% × Demand) + (25% × Votes)]
    → Severity: CRITICAL = 100, HIGH = 75
    → Demand: (Complaints + Upvotes) / Max in District × 100
    → Votes: Direct Votes / Max in District × 100
       │
       ▼
[District Priority Share = Project Score / Σ All District Scores × 100]
    → Street Lights: 65.0/100 → 16.1%
    → Drainage:      59.2/100 → 14.6%
    → Road Blockage: 55.0/100 → 13.6%
       │
       ▼
[Real-time recalculation on every vote/upvote/complaint]
[Officials use priority % to allocate municipal budget]
```

### 3. Google OAuth 2.0 Sign-In Flow

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
[Toast: "Welcome! Signed in with your Google account"]
[Redirect → /dashboard]
```

### 4. Officer Proof Upload & Citizen Verification Flow

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

✅ AI-powered complaint classification with Groq Cloud + Gemini LLM (3-tier failover)  
✅ Multi-lingual NLP — English, Hindi, Hinglish, Odia, and 20+ languages via LLM-first routing  
✅ Community upvoting system for collective prioritization  
✅ **Weighted 100-Point Priority Score Formula** (40% Severity + 35% Demand + 25% Votes)  
✅ **Fixed Engineering Base Costs** — zero artificial budget inflation  
✅ **Real-Time District Priority Share (%)** — live percentage allocation across all ward projects  
✅ **AI Auto-Clustering** of complaints into 74 sub-issue types across 10 municipal sectors  
✅ **Citizen Vote to Fund** — democratic municipal capital allocation  
✅ **Officer Proof Upload + Citizen Verification Ledger** — evidence-grounded resolution  
✅ Fuzzy duplicate detection to prevent redundant filings  
✅ Fuzzy district name matching with `difflib` for typo correction  
✅ Multi-dimensional filtering (status, priority, category, department, location)  
✅ Multi-language support (22 languages) with Google Translate integration  
✅ Hindi, Hinglish & Devanagari intent detection (zero-LLM offline capable)  
✅ GPS auto-detection + all 36 States & UTs with full district coverage  

### SIH S1: Human-in-the-Loop Agentic AI
> *"Create an agentic AI system where humans remain in control of critical decisions."*

✅ **Google OAuth 2.0** — verified citizen identity, no fake accounts  
✅ AI suggests — Human approves (email preview before dispatch)  
✅ Dual submission paths (AI auto-dispatch OR manual form completion)  
✅ Citizens can override AI-inferred categories and departments  
✅ Anonymous filing option gives citizens control over privacy  
✅ Resilient hybrid architecture: Groq Cloud → Gemini → Offline rules-based fallback  
✅ Voice input & speech recognition for hands-free complaint filing in 12+ Indian languages  
✅ **Citizens control resolution** — Verify or Reject officer proof photos  
✅ **Citizens control budget priority** — Democratic voting determines municipal allocation  

---

## 🧪 Testing

```bash
# AI Microservice Tests (44 tests)
cd Ai
python -m pytest app/tests/ -v
# ✅ 44 passed in ~1.0s

# Backend Django Tests
cd backend
python manage.py test
```

---

## 👥 Team

**Aavedan-Setu** — SIH 2026

---

<div align="center">

*Built with ❤️ for Digital India 🇮🇳*

**Empowering citizens. Bridging governance. One complaint at a time.**

</div>
