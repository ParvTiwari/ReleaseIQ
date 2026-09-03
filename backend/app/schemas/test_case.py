from typing import List, Optional
from pydantic import BaseModel


class TestCaseCreate(BaseModel):
    title: str
    area: str = "Permissions"
    priority: str = "High"
    preconditions: Optional[str] = None
    steps: Optional[List[str]] = []
    expected_result: Optional[str] = None


class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    area: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    actual_result: Optional[str] = None
    notes: Optional[str] = None
    executed_by: Optional[str] = None


class TestCaseResponse(BaseModel):
    id: str
    projectId: str
    title: str
    area: str
    priority: str
    status: str
    preconditions: Optional[str] = None
    steps: Optional[List[str]] = []
    expectedResult: Optional[str] = None
    actualResult: Optional[str] = None
    notes: Optional[str] = None
    executedBy: Optional[str] = None
    executedAt: Optional[str] = None

    class Config:
        from_attributes = True
