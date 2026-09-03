import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class PrivacyPolicyArtifact(Base):
    __tablename__ = "privacy_policy_artifacts"

    id = Column(String, primary_key=True, default=lambda: f"priv-{uuid.uuid4().hex[:8]}")
    project_id = Column(String, index=True, nullable=False)
    file_name = Column(String, default="PrivacyPolicy.pdf")
    content = Column(Text, nullable=True)
    status = Column(String, default="Ready")
    clauses_json = Column(Text, nullable=True)  # List of {id, title, category, status, detail, remediation}
    uploaded_at = Column(DateTime, default=datetime.utcnow)
