from typing import Optional
from pydantic import BaseModel


class ComplianceFindingResponse(BaseModel):
    id: str
    projectId: str
    title: str
    status: str
    severity: str
    owner: str
    detail: str
    category: Optional[str] = "Store Policy"
    guidelineRef: Optional[str] = None
    remediation: Optional[str] = None
    exemptionNote: Optional[str] = None

    class Config:
        from_attributes = True


class ComplianceUpdate(BaseModel):
    status: str
    exemptionNote: Optional[str] = None
