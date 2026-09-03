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
from app.schemas.manifest import ManifestArtifactResponse, PrivacyPolicyArtifactResponse
from app.services.compliance_engine import calculate_readiness_score
from app.services.manifest_parser import parse_android_manifest
from app.services.privacy_parser import analyze_privacy_policy

router = APIRouter(prefix="/projects/{project_id}", tags=["Artifacts & Parsers"])


class RawXmlUpload(BaseModel):
    rawXml: str
    fileName: Optional[str] = "AndroidManifest.xml"


class PastePolicyUpload(BaseModel):
    content: str
    fileName: Optional[str] = "PastedPrivacyPolicy.txt"


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

    # Dynamic compliance check: If high-risk location permission exists, ensure background check is flagged
    has_high_location = any(p["risk"] == "High" and "LOCATION" in p["name"] for p in parsed["permissions"])
    findings = db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project_id).all()
    for f in findings:
        if "location" in f.title.lower():
            f.status = "Blocked" if has_high_location else "Passed"

    # Recalculate project readiness score
    finding_dicts = [{"status": f.status} for f in findings]
    new_score, new_status = calculate_readiness_score(finding_dicts)
    project.readiness_score = new_score
    project.status = new_status

    db.commit()

    return {
        "id": manifest.id,
        "projectId": project_id,
        "name": manifest.file_name,
        "size": manifest.file_size,
        "targetSdkVersion": manifest.target_sdk,
        "minSdkVersion": manifest.min_sdk,
        "permissions": parsed["permissions"],
    }


@router.get("/manifest")
def get_manifest(project_id: str, db: Session = Depends(get_db)):
    manifest = db.query(ManifestArtifact).filter(ManifestArtifact.project_id == project_id).first()
    if not manifest:
        # Default mock manifest structure
        return {
            "id": f"man-{project_id}",
            "projectId": project_id,
            "name": "AndroidManifest.xml",
            "size": 4210,
            "targetSdkVersion": 34,
            "minSdkVersion": 26,
            "permissions": [
                {
                    "name": "android.permission.INTERNET",
                    "risk": "Low",
                    "description": "Required for server sync and API communication.",
                    "playStoreGuidance": "Standard normal permission.",
                    "requiredJustification": False,
                },
                {
                    "name": "android.permission.ACCESS_FINE_LOCATION",
                    "risk": "High",
                    "description": "Required for real-time GPS tracking.",
                    "playStoreGuidance": "Must prompt at runtime with prominent disclosure.",
                    "requiredJustification": True,
                },
            ],
        }

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
        text_content = "Privacy Policy: We collect user workout data, email, and telemetry for app operations. Users may request account deletion at https://pulsefit.app/delete-account."

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
        clauses = analyze_privacy_policy("We collect data, share with analytics, and provide deletion at https://example.com/delete.")
        return {
            "id": f"priv-{project_id}",
            "projectId": project_id,
            "fileName": "PrivacyPolicy.pdf",
            "status": "Ready",
            "clauses": clauses,
        }

    clauses = json.loads(policy.clauses_json or "[]")
    return {
        "id": policy.id,
        "projectId": project_id,
        "fileName": policy.file_name,
        "status": policy.status,
        "clauses": clauses,
    }
