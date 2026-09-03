import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.database import Base


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(String, primary_key=True, default=lambda: f"tc-{uuid.uuid4().hex[:8]}")
    project_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    area = Column(String, default="Permissions")  # Smoke, Permissions, Location, Security, Privacy, Store Policy
    priority = Column(String, default="High")  # High, Medium, Low
    status = Column(String, default="Ready")  # Ready, Passed, Blocked, Needs review
    preconditions = Column(Text, nullable=True)
    steps_json = Column(Text, nullable=True)  # List of step strings
    expected_result = Column(Text, nullable=True)
    actual_result = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    executed_by = Column(String, nullable=True)
    executed_at = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
