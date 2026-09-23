# ReleaseIQ

ReleaseIQ is an AI-powered mobile app release readiness and quality assurance platform for Android and iOS teams. It helps developers, QA engineers, and software teams check whether an app is ready for release before submitting it to the Google Play Store or Apple App Store.

The platform brings release checks into one dashboard: app details, privacy policy review, permission analysis, compliance findings, QA test case generation, readiness scoring, reports, and project history.

> **Status as of this README:** Frontend, backend API, database, and an initial AI-assisted audit are built and working end to end. Everything below under "Shipped" is implemented in this codebase today — nothing described there is aspirational. See "Not Yet Shipped" for what's still outstanding.

## Problem We Are Solving

Mobile app releases require teams to manually verify permissions, privacy policy content, store guideline requirements, QA artifacts, release notes, and compliance risks. This process is repetitive, fragmented, and easy to miss under deadline pressure.

ReleaseIQ makes this process structured, faster, and more reliable by combining release workflow management with AI-assisted analysis.

## Shipped

The following is implemented, working, and demonstrable in this codebase today — not planned or mocked-only.

**Frontend**
- A working React 19 + TypeScript app with authenticated routing (sign in, sign up, forgot password, protected routes).
- Every core screen is built and functional: dashboard, projects list, app details, uploads, permissions, compliance, test cases, copy review, reports, verification dossier, and history.
- All of the above screens are wired to the live backend through `src/lib/api.ts` — they read and write real data, not just local mock state.

**Backend**
- A working FastAPI service (`backend/app/main.py`) with real routers for auth, projects, artifacts, compliance, test cases, reports, and AI.
- SQLAlchemy models and a database layer that defaults to local SQLite (`releaseiq.db`) for zero-config dev and can be pointed at PostgreSQL via `DATABASE_URL`.
- JWT-based authentication (`python-jose`, `passlib[bcrypt]`).

**Core analysis logic**
- Real AndroidManifest.xml parsing and permission risk scoring via `defusedxml` (`backend/app/services/manifest_parser.py`) — not mocked.
- A deterministic rule-based compliance engine (`backend/app/services/compliance_engine.py`) that evaluates findings against manifest/privacy data and computes a 0–100 readiness score plus Ready/Needs review/Blocked status.
- An AI audit layer that calls the Groq API (Llama 3.3 70B) when `GROQ_API_KEY` is set, with automatic fallback to the local rule engine if the key is missing or the call fails — the app works with or without a live LLM.
- Report generation and the verification dossier produce a real structured audit bundle with a SHA-256-based verification hash (`backend/app/routers/reports.py`), not placeholder text.

**Data**
- The frontend still ships with initial mock/seed data (`src/data/mockRelease.ts`) used for first paint and as an offline fallback, but on load it fetches live projects, compliance findings, test cases, and artifacts from the backend and persists changes back to it.

## Not Yet Shipped

- Automated test suites (Pytest, Postman, Playwright) — only a manual script exists today (`backend/test_api_endpoints.py`).
- Production deployment setup (AWS), environment hardening, and secrets management.
- Expanded AI capabilities beyond the current audit endpoint: privacy policy validation, permission risk explanations, and AI-generated release recommendations.
- Accessibility and responsiveness passes across all screens.

## Tech Stack

### Frontend

- React 19 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-inspired component structure
- React Router
- Lucide React icons

### Backend

- FastAPI
- SQLAlchemy
- Pydantic / Pydantic Settings
- SQLite (dev) / PostgreSQL (prod, via `DATABASE_URL`)
- JWT auth (`python-jose`, `passlib[bcrypt]`)
- `defusedxml` for safe AndroidManifest.xml parsing

### AI Layer

- Groq API (Llama 3.3 70B, `llama-3.3-70b-versatile`) for AI-assisted compliance/readiness audits
- Deterministic local rule engine as a fallback when no AI key is configured

### Planned / Future

- LangChain / LangGraph for more advanced AI workflows
- Pytest, Postman, Playwright for automated testing
- AWS for deployment

## Build Plan and Progress

ReleaseIQ is being built iteratively, module by module. This tracks the original plan against what's actually done.

| Phase | Scope | Status |
| :--- | :--- | :--- |
| 1. Documentation & Product Planning | SRS, requirements, user stories, product flow, DB/API planning (`docs/ReleaseIQ_Documentation.md`) | **Done** |
| 2. Frontend UI | Dashboard layout, reusable components, all core screens | **Done** |
| 3. Backend API | FastAPI routers, SQLAlchemy models, JWT auth, live API wiring, file uploads | **Done** |
| 4. AI Integration | Groq-based compliance/readiness audit with rule-engine fallback | **Partially done** — audit endpoint is live; privacy policy validation, permission risk explanations, and AI-generated test cases/recommendations are not yet built |
| 5. Testing & Production Readiness | Pytest, Postman, Playwright, accessibility, deployment | **Not started** — only a manual API test script exists |

## Running the Project

### Prerequisites

- Node.js 20 or later
- Python 3.10+
- npm
- Git

Check your installed versions:

```bash
node -v
npm -v
python --version
git --version
```

### Clone the Repository

```bash
git clone https://github.com/Parth-Gupta-github/ReleaseIQ.git
cd ReleaseIQ
```

### Frontend Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

By default, Vite starts the app at:

```text
http://localhost:5173/
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Backend Setup

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the backend server:

```bash
python backend/run_server.py
```

Or with Uvicorn directly:

```bash
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Interactive API docs:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

Run the backend API test script:

```bash
python backend/test_api_endpoints.py
```

### Environment Variables (Backend)

Set these in `backend/.env` (or your shell environment):

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite (dev) or PostgreSQL connection string | `sqlite:///./releaseiq.db` |
| `SECRET_KEY` | JWT signing secret | dev placeholder — change for production |
| `GROQ_API_KEY` | Enables live AI audits via Groq | unset (falls back to local rule engine) |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |

### Useful Commands

```bash
npm install                          # Install frontend dependencies
npm run dev                          # Start frontend dev server
npm run build                        # Create production frontend build
npm run preview                      # Preview production frontend build
pip install -r backend/requirements.txt   # Install backend dependencies
python backend/run_server.py         # Start backend API server
python backend/test_api_endpoints.py # Run backend API tests
```

### Troubleshooting

If frontend dependencies are missing or the app does not start, run `npm install`.

If the Vite port is already in use, Vite will show another available URL in the terminal.

If TypeScript or build errors appear, run `npm run build` and check the terminal output for the exact file and line number.

If the backend fails to start, confirm `pip install -r backend/requirements.txt` completed successfully and that no other process is using port 8000.

## API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT |
| `POST` | `/api/auth/register` | Register new account |
| `GET` | `/api/projects` | List all release suites & compliance scores |
| `POST` | `/api/projects` | Create a new project with store category |
| `POST` | `/api/projects/{id}/clone` | Clone project to Android / iOS |
| `POST` | `/api/projects/{id}/manifest` | Parse AndroidManifest.xml & permission risk |
| `POST` | `/api/projects/{id}/privacy-policy` | Extract & audit privacy policy clauses |
| `GET` | `/api/projects/{id}/compliance` | Fetch compliance evaluation findings |
| `PATCH` | `/api/projects/{id}/compliance/{id}` | Update blocker status / apply exemptions |
| `GET` | `/api/projects/{id}/test-cases` | Fetch / manage QA test cases |
| `POST` | `/api/projects/{id}/ai/audit` | Run AI-assisted readiness audit (Groq, with rule-engine fallback) |
| `GET` | `/api/projects/{id}/report` | Generate structured audit bundle with verification hash |

## Project Structure

```text
ReleaseIQ/
+-- docs/
|   +-- README.md
|   +-- ReleaseIQ_Documentation.md
+-- src/
|   +-- components/       # Screens (dashboard, uploads, compliance, reports, auth, etc.)
|   +-- context/          # AuthContext, ReleaseContext (app-wide state + API wiring)
|   +-- data/              # Seed/mock data used for first paint and fallback
|   +-- lib/               # api.ts (backend client), parsers, report export, utils
|   +-- types/             # Shared TypeScript types
|   +-- App.tsx
|   +-- main.tsx
|   +-- styles.css
+-- backend/
|   +-- app/
|   |   +-- routers/       # auth, projects, artifacts, compliance, test_cases, reports, ai
|   |   +-- services/      # manifest_parser, privacy_parser, compliance_engine, ai_service, auth_service
|   |   +-- models/        # SQLAlchemy models
|   |   +-- schemas/       # Pydantic request/response schemas
|   |   +-- config.py
|   |   +-- database.py
|   |   +-- main.py
|   +-- run_server.py
|   +-- test_api_endpoints.py
|   +-- requirements.txt
+-- index.html
+-- package.json
+-- tailwind.config.js
+-- tsconfig.json
+-- vite.config.ts
```

## Development Approach

- Component-based frontend architecture
- Type-safe development with TypeScript
- Deterministic rule engine as the source of truth, with AI as an assistive layer (not a single point of failure)
- Clear separation between UI, data, and API/service logic
- Scalable folder structure
- Documentation-first planning
- Incremental module development

## Status

Everything listed under "Shipped" above is implemented and integrated in this codebase today. Remaining work is listed under "Not Yet Shipped" — primarily expanded AI capabilities, automated testing, accessibility, and production deployment.
