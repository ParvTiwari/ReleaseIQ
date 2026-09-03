# ReleaseIQ Backend REST API (FastAPI & SQLAlchemy)

High-performance automated mobile store compliance evaluation, XML parsing, and release readiness reporting engine.

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
pip install -r backend/requirements.txt
```

### 2. Start Backend Server
```powershell
python backend/run_server.py
```
Or with Uvicorn:
```powershell
uvicorn app.main:app --app-dir backend --reload --port 8000
```

### 3. Interactive API Documentation
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Run Automated API Tests
```powershell
python backend/test_api_endpoints.py
```

---

## 📦 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT |
| `POST` | `/api/auth/register` | Register new organization account |
| `GET` | `/api/projects` | List all release suites & compliance scores |
| `POST` | `/api/projects` | Create a new project with store categories |
| `POST` | `/api/projects/{id}/clone` | 1-Click clone project to Android / iOS |
| `POST` | `/api/projects/{id}/manifest` | Real XML parser for `AndroidManifest.xml` & permission risk |
| `POST` | `/api/projects/{id}/privacy-policy` | Extract & audit privacy policy clauses |
| `GET` | `/api/projects/{id}/compliance` | Fetch store compliance evaluation findings |
| `PATCH` | `/api/projects/{id}/compliance/{id}` | Update blocker status / apply legal exemptions |
| `GET` | `/api/projects/{id}/test-cases` | Fetch generated QA test cases |
| `GET` | `/api/projects/{id}/report` | Generate structured audit bundle with verification hash |
