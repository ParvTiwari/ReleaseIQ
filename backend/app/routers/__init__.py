from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.artifacts import router as artifacts_router
from app.routers.compliance import router as compliance_router
from app.routers.test_cases import router as test_cases_router
from app.routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "projects_router",
    "artifacts_router",
    "compliance_router",
    "test_cases_router",
    "reports_router",
]
