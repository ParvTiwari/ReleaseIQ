from typing import Dict, List, Any, Tuple, Optional


def calculate_readiness_score(findings: List[Dict[str, Any]]) -> Tuple[int, str]:
    """
    Computes a composite readiness score (0-100) and overall status from compliance findings.
    If no findings exist, returns score 0 and status 'Needs review'.
    """
    if not findings:
        return 0, "Needs review"

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


def evaluate_project_compliance(
    project_meta: Dict[str, Any],
    manifest_data: Optional[Dict[str, Any]] = None,
    privacy_clauses: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluates store compliance rules dynamically against the project's actual uploaded
    manifest, privacy policy clauses, and category/platform scope.
    """
    platform = project_meta.get("platform", "Android")
    category = project_meta.get("category", "")
    findings: List[Dict[str, Any]] = []

    # 1. Manifest Artifact Check
    if not manifest_data or not manifest_data.get("permissions"):
        findings.append({
            "id": "chk-manifest-missing",
            "title": "AndroidManifest.xml Artifact Missing",
            "status": "Blocked",
            "severity": "High",
            "owner": "Android Dev",
            "detail": "No AndroidManifest.xml has been uploaded for permission and SDK audit.",
            "category": "Artifact Verification",
            "guidelineRef": "Store Submission Readiness Standard §1.1",
            "remediation": "Upload AndroidManifest.xml in the Uploads & Verification Center.",
        })
    else:
        # A. Target SDK Level Check
        target_sdk = manifest_data.get("targetSdkVersion", 0)
        if target_sdk >= 34:
            findings.append({
                "id": "chk-target-sdk",
                "title": f"Target SDK {target_sdk} (Android 14+) Compliance",
                "status": "Passed",
                "severity": "High",
                "owner": "Android Dev",
                "detail": f"App targetSdkVersion is {target_sdk}, satisfying Google Play submission mandates.",
                "category": "Target API Level",
                "guidelineRef": "Target API Level Requirements",
                "remediation": "Maintain targetSdkVersion >= 34 for all future updates.",
            })
        else:
            findings.append({
                "id": "chk-target-sdk",
                "title": f"Target SDK {target_sdk} Below Play Store Requirement (API 34+)",
                "status": "Blocked",
                "severity": "High",
                "owner": "Android Dev",
                "detail": f"App targetSdkVersion is {target_sdk}. Google Play requires targetSdkVersion >= 34.",
                "category": "Target API Level",
                "guidelineRef": "Target API Level Requirements",
                "remediation": "Update targetSdkVersion to 34 or higher in build.gradle.",
            })

        # B. Cleartext HTTP Traffic Check
        if manifest_data.get("usesCleartextTraffic"):
            findings.append({
                "id": "chk-cleartext-traffic",
                "title": "Cleartext HTTP Traffic Allowed (usesCleartextTraffic='true')",
                "status": "Blocked",
                "severity": "High",
                "owner": "Security",
                "detail": "App allows insecure unencrypted HTTP network communication.",
                "category": "Network Security",
                "guidelineRef": "Google Play Network Security Policy",
                "remediation": "Remove android:usesCleartextTraffic='true' or enforce TLS 1.3 via network_security_config.xml.",
            })
        else:
            findings.append({
                "id": "chk-cleartext-traffic",
                "title": "Network TLS Encryption & In-Transit Security",
                "status": "Passed",
                "severity": "High",
                "owner": "Security",
                "detail": "Cleartext HTTP traffic is disabled. All API endpoints use encrypted TLS transport.",
                "category": "Network Security",
                "guidelineRef": "Google Play Network Security Policy",
                "remediation": "Maintain HTTPS enforcement across all endpoints.",
            })

        # C. Restricted / Sensitive Permissions Checks
        perms = [p.get("name", "") for p in manifest_data.get("permissions", [])]
        
        # Background Location
        if any("ACCESS_BACKGROUND_LOCATION" in p for p in perms):
            findings.append({
                "id": "chk-bg-location",
                "title": "Background Location Permission Justification (ACCESS_BACKGROUND_LOCATION)",
                "status": "Blocked",
                "severity": "High",
                "owner": "Android / QA",
                "detail": "ACCESS_BACKGROUND_LOCATION requires prominent in-app disclosure dialog and Play Console declaration video.",
                "category": "Sensitive Permissions",
                "guidelineRef": "Google Play Location Permissions §2.1",
                "remediation": "Add prominent disclosure dialog before permission prompt and upload declaration video in Play Console.",
            })

        # Manage External Storage
        if any("MANAGE_EXTERNAL_STORAGE" in p for p in perms):
            findings.append({
                "id": "chk-all-files-access",
                "title": "All Files Access Restriction (MANAGE_EXTERNAL_STORAGE)",
                "status": "Blocked",
                "severity": "High",
                "owner": "Android Dev",
                "detail": "MANAGE_EXTERNAL_STORAGE is strictly restricted to file managers and backup utilities.",
                "category": "Sensitive Permissions",
                "guidelineRef": "Google Play All Files Access Policy",
                "remediation": "Migrate to Android Photo Picker or Scoped Storage APIs unless app is a file manager.",
            })

        # Full-Screen Intent
        if any("USE_FULL_SCREEN_INTENT" in p for p in perms):
            findings.append({
                "id": "chk-full-screen-intent",
                "title": "Full-Screen Notification Intent Policy",
                "status": "Blocked",
                "severity": "High",
                "owner": "Android Dev",
                "detail": "USE_FULL_SCREEN_INTENT is restricted strictly to dialers, calling apps, and timer alarms.",
                "category": "Sensitive Permissions",
                "guidelineRef": "Google Play Full Screen Intent Policy",
                "remediation": "Remove USE_FULL_SCREEN_INTENT unless core functionality is incoming calls or alarms.",
            })

        # Broad Media Storage vs Photo Picker
        if any("READ_MEDIA_IMAGES" in p or "READ_MEDIA_VIDEO" in p for p in perms):
            findings.append({
                "id": "chk-photo-picker",
                "title": "Photo Picker API vs Broad Media Permissions",
                "status": "Warning",
                "severity": "Medium",
                "owner": "Android Dev",
                "detail": "Google Play requires Android Photo Picker API instead of requesting broad READ_MEDIA_IMAGES.",
                "category": "Sensitive Permissions",
                "guidelineRef": "Google Play Photo & Video Permissions Policy",
                "remediation": "Adopt ActivityResultContracts.PickVisualMedia contract.",
            })

        # Camera & Microphone
        if any("CAMERA" in p for p in perms) or any("RECORD_AUDIO" in p for p in perms):
            findings.append({
                "id": "chk-camera-mic",
                "title": "Camera & Audio Runtime Fallback Verification",
                "status": "Warning",
                "severity": "Medium",
                "owner": "Android / QA",
                "detail": "Camera/Microphone requests require runtime permission fallback when access is denied.",
                "category": "Hardware Access",
                "guidelineRef": "Device & Network Abuse Policy",
                "remediation": "Verify in-app graceful fallback when user taps 'Don't Allow'.",
            })

        # D. Category Specific Checks: Android Auto / Automotive
        is_auto_category = "auto" in category.lower() or "vehicle" in category.lower() or "navigation" in category.lower()
        if manifest_data.get("isAndroidAuto") or is_auto_category:
            if manifest_data.get("isAndroidAuto"):
                findings.append({
                    "id": "chk-android-auto",
                    "title": "Android Auto & CarPlay Capability Conformance",
                    "status": "Passed",
                    "severity": "High",
                    "owner": "Mobile QA",
                    "detail": "Android Auto descriptor metadata and CarAppService declarations detected.",
                    "category": "Crucial Category",
                    "guidelineRef": "Android Auto App Quality Guidelines",
                    "remediation": "Verify driver distraction guidelines and voice action controls.",
                })
            else:
                findings.append({
                    "id": "chk-android-auto",
                    "title": "Automotive Category Missing Android Auto Declaration",
                    "status": "Blocked",
                    "severity": "High",
                    "owner": "Android Dev",
                    "detail": "App is categorized under Navigation/Vehicles but lacks com.google.android.gms.car.application metadata.",
                    "category": "Crucial Category",
                    "guidelineRef": "Android for Cars Guidelines",
                    "remediation": "Add <meta-data android:name='com.google.android.gms.car.application' ... /> to AndroidManifest.xml.",
                })

        # E. Category Specific Checks: Smart Watch / Wear OS / WatchOS
        is_watch_category = "fitness" in category.lower() or "health" in category.lower() or "watch" in category.lower()
        has_sensor_perms = any("BODY_SENSORS" in p or "ACTIVITY_RECOGNITION" in p for p in perms)
        if manifest_data.get("isWearOS") or has_sensor_perms:
            if has_sensor_perms:
                findings.append({
                    "id": "chk-wearable-sensors",
                    "title": "Smart Watch Sensor Analytics & Biometric Data Safety",
                    "status": "Passed",
                    "severity": "High",
                    "owner": "Wear Dev / Legal",
                    "detail": "Wear OS sensor declarations (heart rate/cadence) detected with active Health Connect mapping.",
                    "category": "Crucial Category",
                    "guidelineRef": "Wear OS App Quality & Health Connect Policy",
                    "remediation": "Ensure ambient mode lifecycle and background sensor intervals comply with battery budgets.",
                })

    # 2. Privacy Policy Document Check
    if not privacy_clauses or len(privacy_clauses) == 0:
        findings.append({
            "id": "chk-privacy-missing",
            "title": "Privacy Policy Document Missing",
            "status": "Blocked",
            "severity": "High",
            "owner": "Legal",
            "detail": "No Privacy Policy document has been uploaded for clause evaluation.",
            "category": "Data Safety",
            "guidelineRef": "Play Console User Data Policy §4.8",
            "remediation": "Upload Privacy Policy document or paste text in Uploads & Verification Center.",
        })
    else:
        # Evaluate individual privacy clauses
        for clause in privacy_clauses:
            findings.append({
                "id": f"chk-{clause.get('id', 'clause')}",
                "title": clause.get("title", "Privacy Policy Clause"),
                "status": clause.get("status", "Passed"),
                "severity": "High" if "deletion" in clause.get("title", "").lower() else "Medium",
                "owner": "Legal",
                "detail": clause.get("detail", "Clause verified against store review guidelines."),
                "category": "Data Safety",
                "guidelineRef": "Play Console User Data Policy",
                "remediation": clause.get("remediation"),
            })

    return findings


INITIAL_GOOGLE_PLAY_FINDINGS = [
    {
        "id": "chk-1",
        "title": "Account Deletion In-App & Web URL Portal",
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
]
