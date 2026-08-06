# Aavedan Setu — AI Assistant Service

FastAPI microservice providing LLM-powered complaint classification,
drafting, translation, and form validation for the Aavedan Setu
citizen complaint platform. Consumed by a separate Django backend,
which owns persistence and the full complaint lifecycle.

## Architecture

```
Citizen Input
    -> Preprocessing        (utils/text.py)
    -> Prompt Builder        (llm/prompt_builder.py)
    -> Gemini                (llm/gemini_client.py)
    -> JSON Validation+Retry (llm/response_parser.py)
    -> Business Logic        (services/*, knowledge/)
    -> Response               (api/routers/*)
```

Layer responsibilities:

| Folder | Responsibility |
|---|---|
| `core/` | Settings + logging, the only place reading env vars |
| `exceptions/` | Typed exception hierarchy, rooted at `AavedanSetuError` |
| `models/` | Internal domain objects (Complaint, Category, Department, ...) |
| `schemas/` | External API request/response contracts |
| `knowledge/` | Static reference data (YAML) + `knowledge_service.py`, the single access point |
| `prompts/` | Prompt templates, loaded dynamically — never hardcoded in Python |
| `llm/` | Gemini I/O, prompt templating, JSON extraction/validation/retry |
| `services/` | Business logic, one service per concern, coordinated by `ai_orchestrator.py` |
| `api/` | FastAPI routes, dependency wiring (`deps.py`), exception-to-HTTP mapping |
| `tests/` | Pytest suite, organized to mirror the layers above |

The LLM only ever performs reasoning tasks (classification, entity
extraction, drafting, translation). Routing, priority decisions, and
validation rules are decided in Python — see `knowledge/priority_rules.yaml`
and `services/classification_service.py` / `services/form_service.py`.

## Local development

```bash
cp .env.example .env
# edit .env and set GEMINI_API_KEY, DB_DSN

docker compose up --build
```

The service is then available at `http://localhost:8000`, with
interactive API docs at `http://localhost:8000/docs`.

### Without Docker

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit values
uvicorn app.main:app --reload
```

## Running tests

```bash
pip install -r requirements.txt
pytest
```

Tests use a `FakeGeminiClient` test double (see `app/tests/conftest.py`)
rather than calling the real Gemini API, so the suite runs offline and
deterministically.

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check (no LLM/DB dependency) |
| POST | `/api/v1/complaints/classify` | Classify complaint text: category, department, priority, entities |
| POST | `/api/v1/complaints/draft` | Generate a professional complaint draft |
| POST | `/api/v1/complaints/validate-form` | Validate a submitted complaint form (no LLM call) |
| POST | `/api/v1/translate` | Translate text between English, Hindi, Odia |

Full request/response schemas are auto-documented at `/docs`
(Swagger UI) once the service is running.

## Adding a new complaint category or department

Edit `app/knowledge/categories.yaml` / `app/knowledge/departments.yaml`
directly — no code change needed. The knowledge base is cross-validated
at application startup (`app/knowledge/knowledge_service.py`), so a
typo or dangling reference fails the container's startup health check
immediately rather than surfacing as a runtime error later.
