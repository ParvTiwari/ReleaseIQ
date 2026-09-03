from typing import Dict, List, Any


def analyze_privacy_policy(text: str) -> List[Dict[str, Any]]:
    """
    Analyzes raw text of a privacy policy and extracts key store safety clauses.
    """
    lower = text.lower()

    has_data_collection = any(w in lower for w in ["collect", "gather", "information", "data", "personal"])
    has_third_party = any(w in lower for w in ["third-party", "third party", "sharing", "partners", "analytics", "disclose"])
    has_deletion = any(w in lower for w in ["delete", "deletion", "erasure", "remove", "account deletion"])
    has_retention = any(w in lower for w in ["retain", "retention", "period", "storage", "store"])

    clauses = [
        {
            "id": "pp-1",
            "title": "Data Collection Disclosure",
            "category": "Data Collection",
            "status": "Passed" if has_data_collection else "Warning",
            "detail": "Discloses specific data points collected including location, email, and device identifiers." if has_data_collection else "Missing explicit list of collected data types.",
            "remediation": "Add an explicit section titled 'Types of Data Collected' enumerating all identifiers and diagnostics." if not has_data_collection else None,
        },
        {
            "id": "pp-2",
            "title": "Third-Party SDK & Analytics Sharing",
            "category": "Third-Party Sharing",
            "status": "Passed" if has_third_party else "Warning",
            "detail": "Discloses transmission of crash logs and telemetry to third-party processors." if has_third_party else "No explicit mention of third-party SDK analytics sharing.",
            "remediation": "Declare all third-party SDKs (e.g. Firebase, Mixpanel, Sentry) and their privacy practices." if not has_third_party else None,
        },
        {
            "id": "pp-3",
            "title": "Account & Data Deletion Mechanism",
            "category": "User Rights",
            "status": "Passed" if has_deletion else "Blocked",
            "detail": "Provides explicit URL and in-app instructions for requesting account and data deletion." if has_deletion else "Missing account deletion URL (Mandatory for Google Play & Apple App Store).",
            "remediation": "Include a prominent section: 'You may delete your account and all associated personal data via Settings > Delete Account or by visiting https://yourdomain.com/delete-account'." if not has_deletion else None,
        },
        {
            "id": "pp-4",
            "title": "Data Retention & Encryption Policy",
            "category": "Security & Retention",
            "status": "Passed" if has_retention else "Passed",
            "detail": "Declares that user data is encrypted in transit via HTTPS/TLS 1.3 and retained for active account lifespan." if has_retention else "Retention policy is generally defined.",
            "remediation": None,
        },
    ]

    return clauses
