import hashlib
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import ComplianceFinding
from app.models.manifest import ManifestArtifact
from app.models.privacy import PrivacyPolicyArtifact
from app.models.project import Project
from app.models.test_case import TestCase

router = APIRouter(prefix="/projects/{project_id}/report", tags=["Reports"])


@router.get("")
def generate_audit_report(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    manifest = db.query(ManifestArtifact).filter(ManifestArtifact.project_id == project_id).first()
    privacy = db.query(PrivacyPolicyArtifact).filter(PrivacyPolicyArtifact.project_id == project_id).first()
    findings = db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project_id).all()
    test_cases = db.query(TestCase).filter(TestCase.project_id == project_id).all()

    permissions = json.loads(manifest.permissions_json) if manifest and manifest.permissions_json else []
    privacy_clauses = json.loads(privacy.clauses_json) if privacy and privacy.clauses_json else []

    timestamp = datetime.utcnow().isoformat() + "Z"
    hash_payload = f"{project.name}-{project.version}-{project.readiness_score}-{timestamp}"
    verification_hash = f"0x{hashlib.sha256(hash_payload.encode()).hexdigest()[:16]}"

    blocked_count = sum(1 for f in findings if f.status == "Blocked")
    passed_count = sum(1 for f in findings if f.status == "Passed")
    warning_count = sum(1 for f in findings if f.status == "Warning")

    report_payload = {
        "reportId": f"REP-{project.id[:8].upper()}-{datetime.utcnow().strftime('%Y%m%d')}",
        "generatedAt": timestamp,
        "verificationHash": verification_hash,
        "project": {
            "id": project.id,
            "name": project.name,
            "packageId": project.package_id,
            "version": project.version,
            "platform": project.platform,
            "category": project.category,
            "releaseTarget": project.release_target,
            "readinessScore": project.readiness_score,
            "status": project.status,
            "recommendation": "Ready for Store Submission" if project.status == "Ready" else "Submission Blocked by Policy Violations",
        },
        "summary": {
            "totalChecks": len(findings),
            "passedChecks": passed_count,
            "warningChecks": warning_count,
            "blockedChecks": blocked_count,
            "totalTestCases": len(test_cases),
            "passedTestCases": sum(1 for t in test_cases if t.status == "Passed"),
            "highRiskPermissionsCount": sum(1 for p in permissions if p.get("risk") == "High"),
        },
        "manifestAnalysis": {
            "fileName": manifest.file_name if manifest else "AndroidManifest.xml",
            "targetSdkVersion": manifest.target_sdk if manifest else 34,
            "minSdkVersion": manifest.min_sdk if manifest else 26,
            "permissions": permissions,
        },
        "privacyPolicyAudit": {
            "fileName": privacy.file_name if privacy else "PrivacyPolicy.pdf",
            "status": privacy.status if privacy else "Ready",
            "clauses": privacy_clauses,
        },
        "complianceFindings": [
            {
                "id": f.id,
                "title": f.title,
                "status": f.status,
                "severity": f.severity,
                "category": f.category,
                "guidelineRef": f.guideline_ref,
                "detail": f.detail,
                "remediation": f.remediation,
                "exemptionNote": f.exemption_note,
            }
            for f in findings
        ],
        "qaExecutionSuite": [
            {
                "id": t.id,
                "title": t.title,
                "area": t.area,
                "priority": t.priority,
                "status": t.status,
                "executedBy": t.executed_by,
                "executedAt": t.executed_at,
            }
            for t in test_cases
        ],
    }

    return report_payload
