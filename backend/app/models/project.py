import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: f"proj-{uuid.uuid4().hex[:8]}")
    user_id = Column(String, index=True, nullable=True)
    name = Column(String, nullable=False)
    package_id = Column(String, nullable=False)
    version = Column(String, default="1.0.0")
    category = Column(String, default="Health & Fitness")
    release_notes = Column(Text, default="Initial release candidate.")
    platform = Column(String, default="Android")  # Android, iOS, Web & Extension, etc.
    description = Column(Text, nullable=False)
    release_target = Column(String, nullable=False)
    readiness_score = Column(Integer, default=70)
    status = Column(String, default="Needs review")  # Ready, Needs review, Blocked
    custom_policy_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
