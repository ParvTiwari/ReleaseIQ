import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.manifest import ManifestArtifact
from app.models.privacy import PrivacyPolicyArtifact
from app.models.project import Project
from app.services.ai_service import run_groq_ai_audit

router = APIRouter(prefix="/projects/{project_id}/ai-audit", tags=["AI & Compliance Intelligence"])


@router.post("")
def execute_ai_audit(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    manifest = db.query(ManifestArtifact).filter(ManifestArtifact.project_id == project_id).first()
    privacy = db.query(PrivacyPolicyArtifact).filter(PrivacyPolicyArtifact.project_id == project_id).first()

    manifest_data = None
    if manifest:
        manifest_data = {
            "packageName": manifest.package_name,
            "targetSdkVersion": manifest.target_sdk,
            "minSdkVersion": manifest.min_sdk,
            "permissions": json.loads(manifest.permissions_json or "[]"),
            "usesCleartextTraffic": "usesCleartextTraffic=\"true\"" in (manifest.raw_xml or "").lower(),
            "isAndroidAuto": "car.application" in (manifest.raw_xml or "").lower() or "automotive" in (manifest.raw_xml or "").lower(),
            "isWearOS": "watch" in (manifest.raw_xml or "").lower() or "wearable" in (manifest.raw_xml or "").lower(),
        }

    privacy_data = None
    if privacy:
        privacy_data = {
            "fileName": privacy.file_name,
            "clauses": json.loads(privacy.clauses_json or "[]"),
        }

    project_meta = {
        "id": project.id,
        "name": project.name,
        "packageId": project.package_id,
        "platform": project.platform,
        "category": project.category,
        "version": project.version,
    }

    ai_result = run_groq_ai_audit(project_meta, manifest_data, privacy_data)
    return ai_result
