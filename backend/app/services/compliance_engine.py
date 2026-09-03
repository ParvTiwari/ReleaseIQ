from typing import Dict, List, Any, Tuple


def calculate_readiness_score(findings: List[Dict[str, Any]]) -> Tuple[int, str]:
    """
    Computes a composite readiness score (0-100) and overall status.
    """
    if not findings:
        return 75, "Needs review"

    total = len(findings)
    blocked_count = sum(1 for f in findings if f.get("status") == "Blocked")
    passed_count = sum(1 for f in findings if f.get("status") == "Passed")

    score = round((passed_count / total) * 100)
    
    if blocked_count > 0:
        status = "Blocked"
    elif score >= 80:
        status = "Ready"
    else:
        status = "Needs review"

    return score, status


INITIAL_GOOGLE_PLAY_FINDINGS: List[Dict[str, Any]] = [
    {
        "id": "chk-1",
        "title": "Account Deletion Web Link URL",
        "status": "Blocked",
        "severity": "High",
        "owner": "Legal / Web",
        "detail": "Google Play requires a dedicated, publicly accessible URL allowing users to request account and data deletion without reinstalling the app.",
        "category": "Data Safety",
        "guidelineRef": "Play Console User Data Policy §4.8",
        "remediation": "Deploy a dedicated web deletion page (e.g. https://pulsefit.app/delete-account) and submit the link in Play Console > Data safety.",
    },
    {
        "id": "chk-2",
        "title": "Background Location Justification Declaration",
        "status": "Blocked",
        "severity": "High",
        "owner": "Android / QA",
        "detail": "The ACCESS_BACKGROUND_LOCATION permission requires a clear in-app disclosure dialog and a short video demonstration submitted in Play Console.",
        "category": "Sensitive Permissions",
        "guidelineRef": "Google Play Sensitive Permissions & Location §2.1",
        "remediation": "Add a prominent disclosure dialog explaining why background tracking is required before prompting for location permission.",
    },
    {
        "id": "chk-3",
        "title": "Target SDK 34 (Android 14) Compliance",
        "status": "Passed",
        "severity": "High",
        "owner": "Android Dev",
        "detail": "App targetSdkVersion is 34, satisfying the August 2024+ Play Store submission requirement.",
        "category": "Target API Level",
        "guidelineRef": "Target API Level Requirements",
        "remediation": "Maintain targetSdkVersion >= 34 for all future updates.",
    },
    {
        "id": "chk-4",
        "title": "Google Play In-App Billing Library Version 6+",
        "status": "Warning",
        "severity": "Medium",
        "owner": "Android Dev",
        "detail": "The project uses Google Play Billing Library 5.2. Play Store policy mandates migration to Billing Library v6 or v7.",
        "category": "Monetization",
        "guidelineRef": "Play Billing Policy v6 Requirement",
        "remediation": "Upgrade com.android.billingclient:billing dependency to version 6.2.1+ in build.gradle.",
    },
    {
        "id": "chk-5",
        "title": "Data Safety Form Health Data Declaration",
        "status": "Passed",
        "severity": "High",
        "owner": "Legal / Product",
        "detail": "Heart rate, step count, and sleep metrics are marked as 'Collected & Shared for App Functionality' in Data Safety questionnaire.",
        "category": "Data Safety",
        "guidelineRef": "Health & Fitness Apps Policy",
        "remediation": "Ensure encryption in transit is checked as 'Yes' in the Data Safety form.",
    },
]
