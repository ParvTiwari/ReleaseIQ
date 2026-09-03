from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    platform: str = "Android"
    category: str = "Health & Fitness"
    package_id: Optional[str] = None
    version: Optional[str] = "1.0.0"
    release_notes: Optional[str] = "Initial release."
    description: str
    release_target: str
    custom_policy_json: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    category: Optional[str] = None
    package_id: Optional[str] = None
    version: Optional[str] = None
    release_notes: Optional[str] = None
    description: Optional[str] = None
    release_target: Optional[str] = None
    readiness_score: Optional[int] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    package_id: str
    version: str
    category: str
    release_notes: str
    platform: str
    description: str
    release_target: str
    readiness_score: int
    status: str
    custom_policy_json: Optional[str] = None

    class Config:
        from_attributes = True
