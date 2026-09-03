import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class ComplianceFinding(Base):
    __tablename__ = "compliance_findings"

    id = Column(String, primary_key=True, default=lambda: f"chk-{uuid.uuid4().hex[:8]}")
    project_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    status = Column(String, default="Warning")  # Passed, Warning, Blocked
    severity = Column(String, default="Medium")  # High, Medium, Low
    owner = Column(String, default="Android / Legal")
    detail = Column(Text, nullable=False)
    category = Column(String, default="Store Policy")
    guideline_ref = Column(String, nullable=True)
    remediation = Column(Text, nullable=True)
    exemption_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
