import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.test_case import TestCase
from app.schemas.test_case import TestCaseCreate, TestCaseResponse, TestCaseUpdate

router = APIRouter(prefix="/projects/{project_id}/test-cases", tags=["QA Test Cases"])


@router.get("", response_model=List[TestCaseResponse])
def list_test_cases(project_id: str, db: Session = Depends(get_db)):
    tests = db.query(TestCase).filter(TestCase.project_id == project_id).all()
    return [
        {
            "id": t.id,
            "projectId": t.project_id,
            "title": t.title,
            "area": t.area,
            "priority": t.priority,
            "status": t.status,
            "preconditions": t.preconditions,
            "steps": json.loads(t.steps_json or "[]"),
            "expectedResult": t.expected_result,
            "actualResult": t.actual_result,
            "notes": t.notes,
            "executedBy": t.executed_by,
            "executedAt": t.executed_at,
        }
        for t in tests
    ]


@router.post("", response_model=TestCaseResponse)
def create_test_case(
    project_id: str,
    payload: TestCaseCreate,
    db: Session = Depends(get_db),
):
    test = TestCase(
        project_id=project_id,
        title=payload.title,
        area=payload.area,
        priority=payload.priority,
        status="Ready",
        preconditions=payload.preconditions,
        steps_json=json.dumps(payload.steps or []),
        expected_result=payload.expected_result,
    )
    db.add(test)
    db.commit()
    db.refresh(test)

    return {
        "id": test.id,
        "projectId": test.project_id,
        "title": test.title,
        "area": test.area,
        "priority": test.priority,
        "status": test.status,
        "preconditions": test.preconditions,
        "steps": payload.steps or [],
        "expectedResult": test.expected_result,
        "actualResult": test.actual_result,
        "notes": test.notes,
        "executedBy": test.executed_by,
        "executedAt": test.executed_at,
    }


@router.patch("/{test_id}", response_model=TestCaseResponse)
def update_test_case(
    project_id: str,
    test_id: str,
    payload: TestCaseUpdate,
    db: Session = Depends(get_db),
):
    test = db.query(TestCase).filter(
        TestCase.project_id == project_id,
        TestCase.id == test_id,
    ).first()

    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test case not found")

    if payload.title is not None:
        test.title = payload.title
    if payload.area is not None:
        test.area = payload.area
    if payload.priority is not None:
        test.priority = payload.priority
    if payload.status is not None:
        test.status = payload.status
        if payload.status in ["Passed", "Blocked"]:
            test.executed_at = datetime.utcnow().strftime("%b %d, %Y %I:%M %p")
    if payload.actual_result is not None:
        test.actual_result = payload.actual_result
    if payload.notes is not None:
        test.notes = payload.notes
    if payload.executed_by is not None:
        test.executed_by = payload.executed_by

    db.commit()
    db.refresh(test)

    return {
        "id": test.id,
        "projectId": test.project_id,
        "title": test.title,
        "area": test.area,
        "priority": test.priority,
        "status": test.status,
        "preconditions": test.preconditions,
        "steps": json.loads(test.steps_json or "[]"),
        "expectedResult": test.expected_result,
        "actualResult": test.actual_result,
        "notes": test.notes,
        "executedBy": test.executed_by,
        "executedAt": test.executed_at,
    }


@router.delete("/{test_id}")
def delete_test_case(
    project_id: str,
    test_id: str,
    db: Session = Depends(get_db),
):
    test = db.query(TestCase).filter(
        TestCase.project_id == project_id,
        TestCase.id == test_id,
    ).first()

    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test case not found")

    db.delete(test)
    db.commit()
    return {"message": "Test case deleted"}
