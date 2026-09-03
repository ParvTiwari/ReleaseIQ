from typing import List, Optional
from pydantic import BaseModel


class PermissionSchema(BaseModel):
    name: str
    risk: str  # High, Medium, Low
    description: str
    playStoreGuidance: Optional[str] = None
    requiredJustification: Optional[bool] = False


class ManifestArtifactResponse(BaseModel):
    id: str
    projectId: str
    name: str
    size: int
    targetSdkVersion: int
    minSdkVersion: int
    permissions: List[PermissionSchema]

    class Config:
        from_attributes = True


class PrivacyClauseSchema(BaseModel):
    id: str
    title: str
    category: str
    status: str
    detail: str
    remediation: Optional[str] = None


class PrivacyPolicyArtifactResponse(BaseModel):
    id: str
    projectId: str
    fileName: str
    status: str
    clauses: List[PrivacyClauseSchema]

    class Config:
        from_attributes = True
