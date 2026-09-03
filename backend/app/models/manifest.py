import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base


class ManifestArtifact(Base):
    __tablename__ = "manifest_artifacts"

    id = Column(String, primary_key=True, default=lambda: f"man-{uuid.uuid4().hex[:8]}")
    project_id = Column(String, index=True, nullable=False)
    file_name = Column(String, default="AndroidManifest.xml")
    file_size = Column(Integer, default=0)
    target_sdk = Column(Integer, default=34)
    min_sdk = Column(Integer, default=26)
    package_name = Column(String, nullable=True)
    raw_xml = Column(Text, nullable=True)
    permissions_json = Column(Text, nullable=True)  # List of {name, risk, description, playStoreGuidance}
    uploaded_at = Column(DateTime, default=datetime.utcnow)
