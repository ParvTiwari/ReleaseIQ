import json
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import ComplianceFinding
from app.models.manifest import ManifestArtifact
from app.models.privacy import PrivacyPolicyArtifact
from app.models.project import Project
from app.services.compliance_engine import calculate_readiness_score, evaluate_project_compliance
from app.services.manifest_parser import parse_android_manifest
from app.services.privacy_parser import analyze_privacy_policy

router = APIRouter(prefix="/projects/{project_id}", tags=["Artifacts & Parsers"])


def sync_project_compliance(db: Session, project: Project):
    """
    Re-evaluates compliance findings based on currently uploaded manifest and privacy policy.
    """
    manifest = db.query(ManifestArtifact).filter(ManifestArtifact.project_id == project.id).first()
    privacy = db.query(PrivacyPolicyArtifact).filter(PrivacyPolicyArtifact.project_id == project.id).first()

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

    privacy_clauses = None
    if privacy:
        privacy_clauses = json.loads(privacy.clauses_json or "[]")

    project_meta = {
        "id": project.id,
        "name": project.name,
        "platform": project.platform,
        "category": project.category,
    }

    new_findings = evaluate_project_compliance(project_meta, manifest_data, privacy_clauses)

    # Replace DB compliance findings with freshly evaluated findings
    db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project.id).delete()
    for f in new_findings:
        finding = ComplianceFinding(
            project_id=project.id,
            title=f["title"],
            status=f["status"],
            severity=f["severity"],
            owner=f["owner"],
            detail=f["detail"],
            category=f["category"],
            guideline_ref=f.get("guidelineRef"),
            remediation=f.get("remediation"),
        )
        db.add(finding)

    # Recalculate project readiness score & status
    new_score, new_status = calculate_readiness_score(new_findings)
    project.readiness_score = new_score
    project.status = new_status
    db.commit()


@router.post("/manifest")
async def upload_manifest(
    project_id: str,
    file: Optional[UploadFile] = File(None),
    raw_xml: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    content = ""
    filename = "AndroidManifest.xml"

    if file:
        filename = file.filename or "AndroidManifest.xml"
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="ignore")
    elif raw_xml:
        content = raw_xml

    if not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No XML content provided")

    parsed = parse_android_manifest(content)

    manifest = db.query(ManifestArtifact).filter(ManifestArtifact.project_id == project_id).first()
    if not manifest:
        manifest = ManifestArtifact(project_id=project_id)
        db.add(manifest)

    manifest.file_name = filename
    manifest.file_size = len(content.encode("utf-8"))
    manifest.package_name = parsed["packageName"]
    manifest.min_sdk = parsed["minSdkVersion"]
    manifest.target_sdk = parsed["targetSdkVersion"]
    manifest.raw_xml = content
    manifest.permissions_json = json.dumps(parsed["permissions"])

    # Update project packageId if extracted
    if parsed.get("packageName") and parsed["packageName"] != "com.releaseiq.app":
        project.package_id = parsed["packageName"]

    db.commit()

    # Re-evaluate all store compliance findings dynamically
    sync_project_compliance(db, project)

    return {
        "id": manifest.id,
        "projectId": project_id,
        "name": manifest.file_name,
        "size": manifest.file_size,
        "targetSdkVersion": manifest.target_sdk,
        "minSdkVersion": manifest.min_sdk,
        "permissions": parsed["permissions"],
        "features": parsed.get("features", []),
        "usesCleartextTraffic": parsed.get("usesCleartextTraffic", False),
        "isAndroidAuto": parsed.get("isAndroidAuto", False),
        "isWearOS": parsed.get("isWearOS", False),
    }


@router.get("/manifest")
def get_manifest(project_id: str, db: Session = Depends(get_db)):
    manifest = db.query(ManifestArtifact).filter(ManifestArtifact.project_id == project_id).first()
    if not manifest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manifest artifact not found")

    permissions = json.loads(manifest.permissions_json or "[]")
    return {
        "id": manifest.id,
        "projectId": project_id,
        "name": manifest.file_name,
        "size": manifest.file_size,
        "targetSdkVersion": manifest.target_sdk,
        "minSdkVersion": manifest.min_sdk,
        "permissions": permissions,
    }


@router.post("/privacy-policy")
async def upload_privacy_policy(
    project_id: str,
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    text_content = ""
    filename = "PrivacyPolicy.pdf"

    if file:
        filename = file.filename or "PrivacyPolicy.pdf"
        file_bytes = await file.read()
        text_content = file_bytes.decode("utf-8", errors="ignore")
    elif content:
        text_content = content
        filename = "PastedPrivacyPolicy.txt"

    if not text_content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No policy text provided")

    clauses = analyze_privacy_policy(text_content)

    policy = db.query(PrivacyPolicyArtifact).filter(PrivacyPolicyArtifact.project_id == project_id).first()
    if not policy:
        policy = PrivacyPolicyArtifact(project_id=project_id)
        db.add(policy)

    policy.file_name = filename
    policy.content = text_content
    policy.status = "Ready"
    policy.clauses_json = json.dumps(clauses)

    db.commit()

    # Re-evaluate all store compliance findings dynamically
    sync_project_compliance(db, project)

    return {
        "id": policy.id,
        "projectId": project_id,
        "fileName": policy.file_name,
        "status": policy.status,
        "clauses": clauses,
    }


@router.get("/privacy-policy")
def get_privacy_policy(project_id: str, db: Session = Depends(get_db)):
    policy = db.query(PrivacyPolicyArtifact).filter(PrivacyPolicyArtifact.project_id == project_id).first()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privacy policy artifact not found")

    clauses = json.loads(policy.clauses_json or "[]")
    return {
        "id": policy.id,
        "projectId": project_id,
        "fileName": policy.file_name,
        "status": policy.status,
        "clauses": clauses,
    }
