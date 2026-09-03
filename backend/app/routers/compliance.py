from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import ComplianceFinding
from app.models.project import Project
from app.schemas.compliance import ComplianceFindingResponse, ComplianceUpdate
from app.services.compliance_engine import calculate_readiness_score

router = APIRouter(prefix="/projects/{project_id}/compliance", tags=["Compliance Engine"])


@router.get("", response_model=List[ComplianceFindingResponse])
def get_compliance_findings(project_id: str, db: Session = Depends(get_db)):
    findings = db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project_id).all()
    return [
        {
            "id": f.id,
            "projectId": f.project_id,
            "title": f.title,
            "status": f.status,
            "severity": f.severity,
            "owner": f.owner,
            "detail": f.detail,
            "category": f.category,
            "guidelineRef": f.guideline_ref,
            "remediation": f.remediation,
            "exemptionNote": f.exemption_note,
        }
        for f in findings
    ]


@router.patch("/{finding_id}", response_model=ComplianceFindingResponse)
def update_compliance_status(
    project_id: str,
    finding_id: str,
    payload: ComplianceUpdate,
    db: Session = Depends(get_db),
):
    finding = db.query(ComplianceFinding).filter(
        ComplianceFinding.project_id == project_id,
        ComplianceFinding.id == finding_id,
    ).first()

    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")

    finding.status = payload.status
    if payload.exemptionNote is not None:
        finding.exemption_note = payload.exemptionNote

    # Recalculate project readiness score
    findings = db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project_id).all()
    finding_dicts = [{"status": f.status} for f in findings]
    new_score, new_status = calculate_readiness_score(finding_dicts)

    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        project.readiness_score = new_score
        project.status = new_status

    db.commit()
    db.refresh(finding)

    return {
        "id": finding.id,
        "projectId": finding.project_id,
        "title": finding.title,
        "status": finding.status,
        "severity": finding.severity,
        "owner": finding.owner,
        "detail": finding.detail,
        "category": finding.category,
        "guidelineRef": finding.guideline_ref,
        "remediation": finding.remediation,
        "exemptionNote": finding.exemption_note,
    }
