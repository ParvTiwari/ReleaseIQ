import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.compliance import ComplianceFinding
from app.models.project import Project
from app.models.test_case import TestCase
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.auth_service import get_current_user
from app.services.compliance_engine import INITIAL_GOOGLE_PLAY_FINDINGS

router = APIRouter(prefix="/projects", tags=["Projects"])

DEFAULT_PROJECTS = [
    {
        "id": "pulsefit-android",
        "name": "PulseFit Tracker",
        "package_id": "com.pulsefit.tracker",
        "version": "2.4.0",
        "category": "Health & Fitness",
        "release_notes": "Added background GPS workout mapping, Health Connect integration, and real-time cadence tracking.",
        "platform": "Android",
        "description": "Cross-platform mobile fitness app with real-time biometric tracking, GPS running routes, and health data sync.",
        "release_target": "Sep 18, 2026",
        "readiness_score": 78,
        "status": "Blocked",
    },
    {
        "id": "wayfinder-ios",
        "name": "Wayfinder Maps",
        "package_id": "com.wayfinder.navigation",
        "version": "1.8.2",
        "category": "Navigation & Maps",
        "release_notes": "Live turn-by-turn routing with dynamic speed camera alerts.",
        "platform": "iOS",
        "description": "Offline-first turn-by-turn navigation engine with community traffic reports and transit scheduling.",
        "release_target": "Oct 02, 2026",
        "readiness_score": 84,
        "status": "Needs review",
    },
    {
        "id": "cloudvault-corp",
        "name": "Enterprise Cloud Vault Policy",
        "package_id": "policy.cloudvault.soc2",
        "version": "3.0.0",
        "category": "Security & Governance",
        "release_notes": "SOC2 Type II & GDPR quarterly compliance verification baseline.",
        "platform": "Custom Policy",
        "description": "Internal security baseline and privacy rulebook evaluating confidential cloud data storage.",
        "release_target": "Sep 25, 2026",
        "readiness_score": 92,
        "status": "Ready",
    },
]


def seed_default_project_data(db: Session, project_id: str):
    # Seed default compliance findings if none exist
    existing_findings = db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project_id).all()
    if not existing_findings:
        for f in INITIAL_GOOGLE_PLAY_FINDINGS:
            finding = ComplianceFinding(
                project_id=project_id,
                title=f["title"],
                status=f["status"],
                severity=f["severity"],
                owner=f["owner"],
                detail=f["detail"],
                category=f["category"],
                guideline_ref=f["guidelineRef"],
                remediation=f["remediation"],
            )
            db.add(finding)

    # Seed default test cases if none exist
    existing_tests = db.query(TestCase).filter(TestCase.project_id == project_id).all()
    if not existing_tests:
        sample_tests = [
            {
                "title": "Foreground location prompt runtime rejection flow",
                "area": "Permissions",
                "priority": "High",
                "status": "Ready",
                "preconditions": "Fresh install, location permission denied.",
                "steps": [
                    "Open app and start a workout.",
                    "Deny location permission prompt.",
                    "Verify app continues gracefully and displays educational prompt.",
                ],
                "expected_result": "App does not crash and explains location requirement.",
            },
            {
                "title": "Account deletion in-app button and web link verification",
                "area": "Privacy",
                "priority": "High",
                "status": "Passed",
                "preconditions": "User logged in with test account.",
                "steps": [
                    "Navigate to Profile > Account Settings.",
                    "Click 'Delete Account'.",
                    "Verify confirmation modal with data purge warning.",
                ],
                "expected_result": "Account is marked for deletion within 30 days.",
            },
        ]
        for t in sample_tests:
            test = TestCase(
                project_id=project_id,
                title=t["title"],
                area=t["area"],
                priority=t["priority"],
                status=t["status"],
                preconditions=t["preconditions"],
                steps_json=json.dumps(t["steps"]),
                expected_result=t["expected_result"],
            )
            db.add(test)

    db.commit()


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).all()
    if not projects:
        # Seed initial default projects
        for p in DEFAULT_PROJECTS:
            new_p = Project(
                id=p["id"],
                user_id=current_user.id if current_user else None,
                name=p["name"],
                package_id=p["package_id"],
                version=p["version"],
                category=p["category"],
                release_notes=p["release_notes"],
                platform=p["platform"],
                description=p["description"],
                release_target=p["release_target"],
                readiness_score=p["readiness_score"],
                status=p["status"],
            )
            db.add(new_p)
            db.commit()
            seed_default_project_data(db, new_p.id)

        projects = db.query(Project).all()

    return projects


@router.post("", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_custom = payload.platform == "Custom Policy"
    package_id = payload.package_id or (
        f"policy.{payload.name.lower().replace(' ', '')}.suite"
        if is_custom
        else f"com.{payload.name.lower().replace(' ', '')}.app"
    )

    project = Project(
        user_id=current_user.id if current_user else None,
        name=payload.name,
        package_id=package_id,
        version=payload.version or "1.0.0",
        category=payload.category,
        release_notes=payload.release_notes or "Initial release candidate.",
        platform=payload.platform,
        description=payload.description,
        release_target=payload.release_target,
        readiness_score=78 if is_custom else 65,
        status="Needs review",
        custom_policy_json=payload.custom_policy_json,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    seed_default_project_data(db, project.id)

    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/clone", response_model=ProjectResponse)
def clone_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = db.query(Project).filter(Project.id == project_id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source project not found")

    target_platform = "iOS" if source.platform == "Android" else "Android"
    cloned_id = f"proj-{uuid.uuid4().hex[:8]}"
    cloned = Project(
        id=cloned_id,
        user_id=current_user.id if current_user else None,
        name=f"{source.name} ({target_platform})",
        package_id=f"com.{source.name.lower().replace(' ', '')}.{target_platform.lower()}",
        version=source.version,
        category=source.category,
        release_notes=f"Cloned release suite targeting {target_platform}.",
        platform=target_platform,
        description=source.description,
        release_target=source.release_target,
        readiness_score=70,
        status="Needs review",
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    seed_default_project_data(db, cloned.id)

    return cloned


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Cascade delete findings and test cases
    db.query(ComplianceFinding).filter(ComplianceFinding.project_id == project_id).delete()
    db.query(TestCase).filter(TestCase.project_id == project_id).delete()
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
