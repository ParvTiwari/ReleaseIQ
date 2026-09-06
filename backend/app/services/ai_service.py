import json
import urllib.request
import urllib.error
from typing import Dict, List, Any, Optional
from app.config import settings


def call_groq_api(messages: List[Dict[str, str]], json_mode: bool = True) -> Optional[str]:
    """
    Invokes Groq LLM API if GROQ_API_KEY is configured. Returns raw text response or None.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        return None

    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": settings.GROQ_MODEL or "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 1500,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "ReleaseIQ/1.0",
    }

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[GROQ AI WARNING] Groq API call failed or timed out: {e}")
        return None


def run_groq_ai_audit(
    project_meta: Dict[str, Any],
    manifest_data: Optional[Dict[str, Any]] = None,
    privacy_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes an intelligent release readiness and policy compliance audit using Groq LLM,
    with robust local semantic rule fallback.
    """
    app_name = project_meta.get("name", "App")
    platform = project_meta.get("platform", "Android")
    category = project_meta.get("category", "General")
    permissions = manifest_data.get("permissions", []) if manifest_data else []
    target_sdk = manifest_data.get("targetSdkVersion", 34) if manifest_data else 34
    uses_cleartext = manifest_data.get("usesCleartextTraffic", False) if manifest_data else False
    is_auto = manifest_data.get("isAndroidAuto", False) if manifest_data else False
    is_wear = manifest_data.get("isWearOS", False) if manifest_data else False
    privacy_clauses = privacy_data.get("clauses", []) if privacy_data else []

    # Prompt Groq if key is present
    system_prompt = (
        "You are an expert Google Play Store and Apple App Store compliance auditor. "
        "Analyze the provided mobile application manifest, declared permissions, and privacy policy clauses. "
        "Evaluate: 1) Restricted permissions requiring Play Store / App Store justification, "
        "2) Crucial category compliance (CarPlay / Android Auto, Smart Watch / Wear OS), "
        "3) Insecure cleartext traffic, "
        "4) Semantic consistency between permissions and privacy policy disclosures. "
        "Respond ONLY with a valid JSON object matching the schema: "
        "{ 'executiveSummary': str, 'restrictedPermissionsAnalysis': [ { 'permission': str, 'risk': str, 'justificationRequired': bool, 'storeGuidance': str } ], 'categoryCompliance': { 'isAutomotive': bool, 'automotiveStatus': str, 'isWearable': bool, 'wearableStatus': str, 'details': str }, 'privacyPolicyConsistency': { 'status': str, 'missingDisclosures': [str] }, 'actionableChecklist': [str] }"
    )

    user_prompt = f"""
Application Name: {app_name}
Target Platform: {platform}
Store Category: {category}
Target SDK: {target_sdk}
Cleartext HTTP Traffic Allowed: {uses_cleartext}
Is Android Auto / CarPlay: {is_auto}
Is Wear OS / Smart Watch: {is_wear}
Declared Permissions ({len(permissions)}): {json.dumps([p.get('name') for p in permissions])}
Evaluated Privacy Policy Clauses ({len(privacy_clauses)}): {json.dumps([c.get('title') for c in privacy_clauses])}
"""

    ai_response_text = call_groq_api([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ])

    if ai_response_text:
        try:
            return json.loads(ai_response_text)
        except Exception:
            pass

    # Heuristic / Deterministic Fallback Engine
    perm_names = [p.get("name", "") for p in permissions]
    high_risks = [p for p in permissions if p.get("risk") == "High"]

    restricted_analysis = []
    for p in permissions:
        if p.get("requiredJustification") or p.get("risk") in ["High", "Medium"]:
            restricted_analysis.append({
                "permission": p.get("name"),
                "risk": p.get("risk"),
                "justificationRequired": p.get("requiredJustification", False),
                "storeGuidance": p.get("playStoreGuidance", "Verify runtime declaration in Play Console."),
            })

    # Category checks
    auto_status = "Compliant" if is_auto else ("Not Applicable" if "auto" not in category.lower() else "Missing CarAppService")
    wear_status = "Compliant" if (is_wear or any("BODY_SENSORS" in p for p in perm_names)) else "Not Applicable"

    actionable_items = []
    if any("ACCESS_BACKGROUND_LOCATION" in p for p in perm_names):
        actionable_items.append("Submit background location demonstration video and prominent in-app disclosure dialog.")
    if any("MANAGE_EXTERNAL_STORAGE" in p for p in perm_names):
        actionable_items.append("Replace MANAGE_EXTERNAL_STORAGE with Android Photo Picker API.")
    if uses_cleartext:
        actionable_items.append("Disable android:usesCleartextTraffic to enforce encrypted HTTPS transport.")
    if target_sdk < 34:
        actionable_items.append(f"Upgrade targetSdkVersion from {target_sdk} to 34+ for Google Play 2024+ requirements.")
    if not actionable_items:
        actionable_items.append("All primary store policy validations and sensitive permissions meet standard release criteria.")

    return {
        "executiveSummary": f"Release readiness analysis for {app_name} ({platform}). Detected {len(permissions)} permissions ({len(high_risks)} high risk), target SDK {target_sdk}.",
        "restrictedPermissionsAnalysis": restricted_analysis,
        "categoryCompliance": {
            "isAutomotive": is_auto or "auto" in category.lower(),
            "automotiveStatus": auto_status,
            "isWearable": is_wear or "fitness" in category.lower(),
            "wearableStatus": wear_status,
            "details": f"Evaluated under {category} store criteria with target SDK {target_sdk}.",
        },
        "privacyPolicyConsistency": {
            "status": "Consistent" if len(privacy_clauses) > 0 else "Missing Privacy Disclosures",
            "missingDisclosures": [] if len(privacy_clauses) > 0 else ["Mandatory account deletion URL (§4.8)", "Third-party analytics SDK list"],
        },
        "actionableChecklist": actionable_items,
    }
