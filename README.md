# 🏛️ GovConnect: AI-Powered Government Complaint & Scheme Recommendation Platform

> **Smart India Hackathon (SIH) Project**
> 
> GovConnect is an enterprise-grade citizen empowerment portal. It features a modern **React 19 Frontend**, a robust **Django REST Framework (DRF) Backend** for complaint tracking and core database services, and a dedicated **FastAPI AI Microservice** powered by the **Google Gemini SDK** for intent classification, language translation, email drafting, and eligibility evaluations.

---

## 📖 Table of Contents
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Installation & Setup](#-installation--setup)
  - [1. Backend Setup (Django REST Framework)](#1-backend-setup-django-rest-framework)
  - [2. AI Microservice Setup (FastAPI)](#2-ai-microservice-setup-fastapi)
  - [3. Frontend Setup (React 19 + Vite)](#3-frontend-setup-react-19--vite)
- [Database Seeding & CSV Import Specifications](#-database-seeding--csv-import-specifications)
- [API Documentation](#-api-documentation)
- [Core Workflows](#-core-workflows)
  - [AI Grievance Assistant & Email Dispatching](#1-ai-grievance-assistant--email-dispatching)
  - [Welfare Scheme Recommendation & Residency Matching](#2-welfare-scheme-recommendation--residency-matching)
  - [Robust Keyword Fallback Search](#3-robust-keyword-fallback-search-when-llm-rate-limited)

---

## 📊 System Architecture

GovConnect divides operations into three independent service layers to maximize speed, scalability, and modularity:

```
                  ┌─────────────────────────────────────────┐
                  │          React 19 Frontend              │
                  │        (Citizen Portal - Port 5173)     │
                  └────────────────────┬────────────────────┘
                                       │
                                       │ (JSON over HTTP / JWT Auth)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Django DRF Backend             │
                  │         (Core Services - Port 8000)     │
                  └──────────┬───────────────────▲──────────┘
                             │                   │
  (Read/Write DB Sync)       │                   │ (JSON / API Calls)
                             ▼                   ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│     PostgreSQL Database      │       │     FastAPI AI Service       │
│     (State, District,        │       │  (Gemini Pipeline - Port 8010)│
│    Schemes, Complaints)      │       └──────────────┬───────────────┘
└──────────────────────────────┘                      │
                                                      │ (Gemini API SDK)
                                                      ▼
                                       ┌──────────────────────────────┐
                                       │     Google Gemini Pro /      │
                                       │       Flash LLM Client       │
                                       └──────────────────────────────┘
```

---

## 🔒 Key Features

* **Multi-Layered AI Pipeline**: Context-aware intent classification, translation, and extraction powered by a FastAPI coordinator with automatic JSON validations and retry policies.
* **Dual-Mechanism Auth**: Standard Email/Password login along with JWT generation and token-refresh interceptors.
* **Interactive Dashboard**: Modern statistics visualizations showing resolution times, monthly trends, and department distribution charts (built with Chart.js).
* **AI-Assisted Grievance Dispatcher**: State-based conversation flow to draft grievance emails automatically, locating official department offices based on the citizen's district and state.
* **Inline Image Evidence Embedding**: Dynamic embedding of evidence photos inside email body templates via Content-IDs (`cid:evidence_X`) rather than simple attachments.
* **State-Based Schemes Recommender**: Recommends regional and national yojanas based on eligibility parameters (family income, study levels, age, caste, and state residency).
* **Fuzzy Typo Tolerant Fallback Matcher**: If the Gemini API is rate-limited (429 error), a backup database search engine takes over, processing inputs with typo-tolerant prefix checks (e.g. mapping `"schlorshipp"` or `"sttudy"` to `Education`).

---

## 🛠 Tech Stack

### Frontend
* **Core**: React 19, Vite, React Router DOM v6
* **Data Fetching**: TanStack Query v5 (React Query), Axios
* **Styling**: Tailwind CSS v4, Framer Motion (premium micro-animations)
* **Visualization**: Chart.js, React-Chartjs-2
* **Feedback**: React Toastify, React Icons (Hi2 & Fi)

### Backend (Core Services)
* **Framework**: Django 5.x, Django REST Framework (DRF)
* **Auth**: SimpleJWT (JSON Web Tokens)
* **Database**: PostgreSQL / SQLite (for testing)
* **Integrations**: Django Signals (`post_save`), SMTP Mailer Client

### AI Microservice
* **Framework**: FastAPI, Uvicorn
* **SDK**: Google GenAI / Gemini Client
* **Parsing**: Pydantic v2 (Strict schema validation)

---

## 📂 Project Directory Structure

```
gov_complaint_schemes/
├── backend/                   # Django DRF Core Backend
│   ├── accounts/              # User account registration and authentication
│   ├── complaints/            # Grievance registration, updates, and timeline history
│   ├── departments/           # Government departments registry
│   ├── categories/            # Core complaint categories
│   ├── locations/             # States and districts lists (Indian geo-data)
│   ├── schemes/               # Welfare schemes and requirements database
│   ├── ai/                    # Django-side AI orchestrator proxies and memory handlers
│   └── manage.py              # Django entrypoint
│
├── Ai/                        # FastAPI AI Microservice
│   ├── app/
│   │   ├── api/               # Router endpoints (classify, recommend, translate)
│   │   ├── core/              # Config variables and custom logging
│   │   ├── llm/               # Gemini client wrappers and JSON response parsers
│   │   ├── prompts/           # LLM templates (classification, scheme recommendation)
│   │   └── services/          # AI pipeline orchestrators and business services
│   └── requirements.txt       # FastAPI pip dependencies
│
├── frontend/                  # React 19 Client Dashboard
│   ├── src/
│   │   ├── components/        # Sidebar, Navbar, Loading Spinner, Map coordinate pickers
│   │   ├── context/           # Authentication state context
│   │   ├── hooks/             # TanStack Query bindings
│   │   ├── pages/             # Dashboard, Schemes, Grievance creation & editing forms
│   │   └── services/          # REST endpoints API wrappers
│   └── vite.config.js         # Port proxy configurations to avoid CORS
│
└── requirements.txt           # Unified base Python requirements
```

---

## 🚀 Installation & Setup

### Prerequisite Requirements
* **Python 3.11+**
* **Node.js 18+ (npm)**
* **PostgreSQL** (Optional, falls back to SQLite if database environment keys are omitted)

---

### 1. Backend Setup (Django REST Framework)

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv myenv
   ```

2. Activate the virtual environment:
   * **Windows**: `myenv\Scripts\activate`
   * **Linux/macOS**: `source myenv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend/` folder:
   ```env
   SECRET_KEY=your_django_secret_key_here
   DEBUG=True
   
   # Optional: Configure local PostgreSQL credentials 
   DB_NAME=gov_complaint_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

5. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. Create a Superuser (Mandatory for Django Admin Access):
   ```bash
   python manage.py createsuperuser
   ```

7. Run the server:
   ```bash
   python manage.py runserver
   ```
   *The backend will boot up at:* `http://127.0.0.1:8000/`

---

### 2. AI Microservice Setup (FastAPI)

1. Navigate to the `Ai` folder:
   ```bash
   cd ../Ai
   ```

2. Reuse your virtual environment or create a new one, then install requirements:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `Ai/` folder:
   ```env
   APP_ENVIRONMENT=local
   APP_DEBUG=true
   
   # Provide your Gemini API key (essential for AI chat and recommendations)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL_NAME=gemini-flash-latest
   
   DB_DSN=postgresql://postgres:postgres123@localhost:5432/gov_assist_db
   ```

4. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
   ```
   *The AI service will boot up at:* `http://127.0.0.1:8010/`

---

### 3. Frontend Setup (React 19 + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Start the Vite server:
   ```bash
   npm run dev
   ```
   *The Citizen dashboard will boot up at:* `http://localhost:5173/`

---

## 📊 Database Seeding & CSV Import Specifications

GovConnect includes database seeding scripts to load all base categories, departments, complaint types, Indian locations, and welfare schemes. 

You can seed everything in one unified command:

```bash
cd backend
python seed_all.py
```

*(Under the hood, this executes `seed_categories.py`, `seed_departments.py`, `seed_knowledge.py`, `seed_locations.py`, and `seed_schemes.py` in the correct database dependency order).*

### 📋 Custom CSV Seeding Specifications
If you wish to import custom schemes or department office contact lists via CSV files, a professional PDF specifications sheet has been compiled in the workspace root:

* 📄 **Specifications Document:** [CSV_Seeding_Templates_Specifications.pdf](file:///e:/Starting%20new/gov_complaint_schemes/CSV_Seeding_Templates_Specifications.pdf)
* It details all required column headers for `schemes.csv` (name, code, eligibility, required_documents) and `offices.csv` (office_name, district, state, official grievance email address).

---

## 🔐 API Documentation

### Auth Module (`/api/auth/`)
* `POST /api/auth/register/` - Create a citizen account.
* `POST /api/auth/login/` - Login and get JWT access & refresh tokens.
* `GET /api/auth/profile/` - Fetch citizen contact/location profile details.

### Grievances Module (`/api/complaints/`)
* `POST /api/complaints/create/` - Create a new complaint.
* `PATCH /api/complaints/{id}/update/` - Edit complaint category, location, or descriptions.
* `DELETE /api/complaints/{id}/delete/` - Soft-delete a complaint record (`is_deleted=True`).
* `GET /api/complaints/my/` - List complaints filed by the active citizen.

### AI Assistant Module (`/api/ai/`)
* `POST /api/ai/chat/` - Chat with Aavedan Saathi AI Assistant (processes user inputs, detects file intent, and retains session state).
* `GET /api/ai/email-preview/` - Slide-out drawer preview of the drafted grievance email.
* `POST /api/ai/email-dispatch/` - Send email with embedded base64 evidence images inline.

---

## 📧 Core Workflows

### 1. AI Grievance Assistant & Email Dispatching
* **Interaction**: The citizen talks to Aavedan Saathi to explain their public issues (e.g. water leakage, broken streetlights).
* **Metadata Override**: If the user overrides categories or departments in the form, the AI respects human inputs over its automated inferences.
* **Email Compilation**: The system compiles the complaint text, looks up the corresponding department office's email in that district, embeds uploaded images as inline attachments via `cid:evidence_X`, and routes the email through the SMTP channel.

### 2. Welfare Scheme Recommendation & Residency Matching
* **Parameters**: The recommender uses eligibility metadata (income, state, age, caste) and matches it against database schemes.
* **Residency Enforcement**: If a scheme is region-locked (e.g., Biju Pucca Ghar Yojana is exclusive to Odisha), the system checks the user's active state (e.g., Bihar) and flags the scheme accordingly.

### 3. Robust Keyword Fallback Search (When LLM Rate-Limited)
If the Gemini API returns a `429 Too Many Requests` error, the system initiates the local backup matcher:
* **Fuzzy Typos**: Handles spelling typos like `"sttudy"` (double-t) or `"schlorshipp"` (missing a) using root-prefix checks.
* **Topic Exclusivity**: If a citizen requests a housing scheme, the fallback matcher limits results exclusively to the `Housing` category, avoiding showing unrelated scholarships or crop yojanas.
* **Smart Filtering**: Filters out all ineligible schemes by default to prevent cluttered cards with red crosses (`❌`), showing a clean "No eligible schemes found" message. If a user asks *"why not Biju Pucca Ghar Yojana"*, the system bypasses this filter to explain the exact eligibility failure reason.
