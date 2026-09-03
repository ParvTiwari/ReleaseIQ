import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"usr-{uuid.uuid4().hex[:8]}")
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Project Owner")  # Project Owner, QA Reviewer, Legal Auditor, Mobile Engineer
    organization = Column(String, default="ReleaseIQ Technologies")
    avatar_initials = Column(String, default="PT")
    two_factor_enabled = Column(Boolean, default=False)
    api_token = Column(String, unique=True, index=True, default=lambda: f"rq_live_{uuid.uuid4().hex}")
    created_at = Column(DateTime, default=datetime.utcnow)
