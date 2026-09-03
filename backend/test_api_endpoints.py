import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def run_tests():
    print("[START] Starting Backend REST API Tests...")

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200, f"Health failed: {res.text}"
    print("[PASS] /health check passed")

    # 2. Auth register / login
    login_res = client.post(
        "/api/auth/login",
        json={"email": "parvtiwari1@gmail.com", "password": "password123", "role": "Project Owner"},
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] /api/auth/login passed")

    # 3. List projects
    projects_res = client.get("/api/projects", headers=headers)
    assert projects_res.status_code == 200, f"List projects failed: {projects_res.text}"
    projects = projects_res.json()
    assert len(projects) >= 1, "Expected at least 1 project"
    project_id = projects[0]["id"]
    print(f"[PASS] /api/projects returned {len(projects)} projects (Active: {project_id})")

    # 4. Upload manifest
    sample_manifest = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.pulsefit.tracker">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
    <application android:label="PulseFit">
    </application>
</manifest>"""
    manifest_res = client.post(
        f"/api/projects/{project_id}/manifest",
        data={"raw_xml": sample_manifest},
        headers=headers,
    )
    assert manifest_res.status_code == 200, f"Manifest upload failed: {manifest_res.text}"
    manifest_data = manifest_res.json()
    assert manifest_data["targetSdkVersion"] == 34
    print(f"[PASS] /api/projects/{project_id}/manifest parsed SDK 34 and {len(manifest_data['permissions'])} permissions")

    # 5. Upload privacy policy
    policy_res = client.post(
        f"/api/projects/{project_id}/privacy-policy",
        data={"content": "We collect user biometric data. For account deletion, visit https://pulsefit.app/delete-account."},
        headers=headers,
    )
    assert policy_res.status_code == 200, f"Policy upload failed: {policy_res.text}"
    policy_data = policy_res.json()
    assert len(policy_data["clauses"]) >= 1
    print(f"[PASS] /api/projects/{project_id}/privacy-policy parsed {len(policy_data['clauses'])} clauses")

    # 6. Compliance findings
    comp_res = client.get(f"/api/projects/{project_id}/compliance", headers=headers)
    assert comp_res.status_code == 200, f"Compliance failed: {comp_res.text}"
    findings = comp_res.json()
    assert len(findings) >= 1
    print(f"[PASS] /api/projects/{project_id}/compliance returned {len(findings)} findings")

    # 7. Toggle compliance finding status
    finding_id = findings[0]["id"]
    patch_res = client.patch(
        f"/api/projects/{project_id}/compliance/{finding_id}",
        json={"status": "Passed", "exemptionNote": "Remediated in web portal release."},
        headers=headers,
    )
    assert patch_res.status_code == 200, f"Patch failed: {patch_res.text}"
    print(f"[PASS] /api/projects/{project_id}/compliance/{finding_id} status updated")

    # 8. Test cases
    test_res = client.get(f"/api/projects/{project_id}/test-cases", headers=headers)
    assert test_res.status_code == 200, f"Test cases failed: {test_res.text}"
    tests = test_res.json()
    print(f"[PASS] /api/projects/{project_id}/test-cases returned {len(tests)} tests")

    # 9. Report generation
    rep_res = client.get(f"/api/projects/{project_id}/report", headers=headers)
    assert rep_res.status_code == 200, f"Report failed: {rep_res.text}"
    report = rep_res.json()
    assert "verificationHash" in report
    print(f"[PASS] /api/projects/{project_id}/report generated audit report (Hash: {report['verificationHash']})")

    print("\n[SUCCESS] ALL BACKEND API ENDPOINT TESTS PASSED SUCCESSFULLY!")


if __name__ == "__main__":
    run_tests()
