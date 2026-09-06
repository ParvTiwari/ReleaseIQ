import re
from typing import Dict, List, Any
import defusedxml.ElementTree as ET

ANDROID_NS = "http://schemas.android.com/apk/res/android"

KNOWN_PERMISSIONS_RISK: Dict[str, Dict[str, Any]] = {
    # Location
    "ACCESS_BACKGROUND_LOCATION": {
        "risk": "High",
        "desc": "Accesses device location continuously when app is in the background.",
        "guidance": "Google Play requires prominent in-app disclosure dialog and declaration video approval.",
        "justification": True,
    },
    "ACCESS_FINE_LOCATION": {
        "risk": "High",
        "desc": "Accesses precise GPS device location.",
        "guidance": "Must prompt at runtime with feature-specific rationale before system dialog.",
        "justification": True,
    },
    "ACCESS_COARSE_LOCATION": {
        "risk": "Medium",
        "desc": "Accesses approximate network-derived device location.",
        "guidance": "Prefer coarse location over fine location when precise GPS is non-essential.",
        "justification": False,
    },
    # Storage & Media
    "MANAGE_EXTERNAL_STORAGE": {
        "risk": "High",
        "desc": "Grants broad all-files access across device shared storage.",
        "guidance": "Google Play strictly restricts this to file managers, antivirus, and backup apps.",
        "justification": True,
    },
    "READ_MEDIA_IMAGES": {
        "risk": "High",
        "desc": "Reads photo and image files from shared storage on Android 13+.",
        "guidance": "Google Play mandates migration to Android Photo Picker unless broad access is core.",
        "justification": True,
    },
    "READ_MEDIA_VIDEO": {
        "risk": "High",
        "desc": "Reads video files from shared storage on Android 13+.",
        "guidance": "Use Android Photo Picker API instead of requesting broad media access.",
        "justification": True,
    },
    "READ_MEDIA_AUDIO": {
        "risk": "Medium",
        "desc": "Reads audio files from shared storage on Android 13+.",
        "guidance": "Declare user-facing audio playback or editing feature rationale.",
        "justification": True,
    },
    "READ_EXTERNAL_STORAGE": {
        "risk": "Medium",
        "desc": "Legacy permission to read external storage files.",
        "guidance": "Target SDK 33+ apps must migrate to Granular Media permissions.",
        "justification": False,
    },
    "WRITE_EXTERNAL_STORAGE": {
        "risk": "Medium",
        "desc": "Legacy permission to write external storage files.",
        "guidance": "Target SDK 33+ apps should use Scoped Storage and MediaStore APIs.",
        "justification": False,
    },
    # System & Notification Restrictive
    "USE_FULL_SCREEN_INTENT": {
        "risk": "High",
        "desc": "Allows notification to take over full display during locked screen.",
        "guidance": "Google Play limits this exclusively to live incoming calls and active timer alarms.",
        "justification": True,
    },
    "SCHEDULE_EXACT_ALARM": {
        "risk": "High",
        "desc": "Schedules exact-time alarm alarms with system wake lock.",
        "guidance": "Restricted to calendar/alarm apps. Other apps must use WorkManager or setWindow().",
        "justification": True,
    },
    "USE_EXACT_ALARM": {
        "risk": "Medium",
        "desc": "Pre-granted exact alarm permission for primary clock and timer apps.",
        "guidance": "Only available for core alarm clock and timer apps.",
        "justification": True,
    },
    "REQUEST_INSTALL_PACKAGES": {
        "risk": "High",
        "desc": "Allows requesting installation of package APKs directly.",
        "guidance": "Restricted to verified app stores, enterprise device managers, and browser downloaders.",
        "justification": True,
    },
    "QUERY_ALL_PACKAGES": {
        "risk": "High",
        "desc": "Allows inspecting inventory of all installed apps on device.",
        "guidance": "Play Store requires justification form. Search/antivirus apps only.",
        "justification": True,
    },
    "SYSTEM_ALERT_WINDOW": {
        "risk": "High",
        "desc": "Allows drawing floating overlay windows over other applications.",
        "guidance": "Must justify why floating UI is essential to core app functionality.",
        "justification": True,
    },
    "POST_NOTIFICATIONS": {
        "risk": "Low",
        "desc": "Sends push notifications on Android 13+ (API 33+).",
        "guidance": "Standard runtime permission. Prompt after user engages with relevant features.",
        "justification": False,
    },
    # Hardware & Sensors
    "CAMERA": {
        "risk": "High",
        "desc": "Captures photos and real-time video streams from camera sensors.",
        "guidance": "Declare camera usage rationale. Must never access hardware in background.",
        "justification": True,
    },
    "RECORD_AUDIO": {
        "risk": "High",
        "desc": "Records audio streams from device microphones.",
        "guidance": "Declare microphone usage rationale. Prominently notify user when recording.",
        "justification": True,
    },
    "BODY_SENSORS": {
        "risk": "High",
        "desc": "Accesses biometric sensors (heart rate, ECG, body temperature).",
        "guidance": "Google Play Health & Fitness policy requires explicit Data Safety declarations.",
        "justification": True,
    },
    "BODY_SENSORS_BACKGROUND": {
        "risk": "High",
        "desc": "Continuous background monitoring of health biometric sensors.",
        "guidance": "Mandates prominent in-app disclosure and Health Connect compliance.",
        "justification": True,
    },
    "ACTIVITY_RECOGNITION": {
        "risk": "Medium",
        "desc": "Detects user physical movement (walking, running, cycling, vehicle).",
        "guidance": "Declare fitness or automatic trip detection feature rationale.",
        "justification": True,
    },
    # Networking & Phone
    "INTERNET": {
        "risk": "Low",
        "desc": "Opens standard network socket connections.",
        "guidance": "Standard normal permission. Must comply with Data Safety HTTPS encryption.",
        "justification": False,
    },
    "ACCESS_NETWORK_STATE": {
        "risk": "Low",
        "desc": "Inspects cellular, Wi-Fi, and network availability state.",
        "guidance": "Standard normal permission.",
        "justification": False,
    },
    "READ_PHONE_STATE": {
        "risk": "High",
        "desc": "Reads phone state, cellular network info, and incoming call status.",
        "guidance": "Play Store restricts access. Avoid reading IMEI or hardware identifiers.",
        "justification": True,
    },
    "READ_CONTACTS": {
        "risk": "High",
        "desc": "Reads user personal address book and contact details.",
        "guidance": "Must justify social or communication feature requirement in Play Console.",
        "justification": True,
    },
    "READ_CALENDAR": {
        "risk": "Medium",
        "desc": "Reads user personal calendar events.",
        "guidance": "Declare calendar integration context.",
        "justification": False,
    },
    "WRITE_CALENDAR": {
        "risk": "Medium",
        "desc": "Creates or edits calendar events.",
        "guidance": "Declare calendar integration context.",
        "justification": False,
    },
}


def parse_android_manifest(xml_content: str) -> Dict[str, Any]:
    """
    Parses AndroidManifest.xml string and returns structured metadata, SDK versions,
    parsed permissions, hardware features, automotive/watch detection, and cleartext traffic.
    """
    package_name = "com.releaseiq.app"
    min_sdk = 26
    target_sdk = 34
    permissions: List[Dict[str, Any]] = []
    features: List[str] = []
    services: List[Dict[str, Any]] = []
    uses_cleartext_traffic = False
    is_android_auto = False
    is_wear_os = False

    try:
        root = ET.fromstring(xml_content)
        package_name = root.attrib.get("package") or root.attrib.get(f"{{{ANDROID_NS}}}package") or "com.releaseiq.app"

        # Check uses-sdk
        uses_sdk = root.find("uses-sdk")
        if uses_sdk is not None:
            min_attr = uses_sdk.attrib.get(f"{{{ANDROID_NS}}}minSdkVersion") or uses_sdk.attrib.get("minSdkVersion")
            target_attr = uses_sdk.attrib.get(f"{{{ANDROID_NS}}}targetSdkVersion") or uses_sdk.attrib.get("targetSdkVersion")
            if min_attr:
                try:
                    min_sdk = int(min_attr)
                except ValueError:
                    pass
            if target_attr:
                try:
                    target_sdk = int(target_attr)
                except ValueError:
                    pass

        # Check application tag for cleartext traffic
        app_elem = root.find("application")
        if app_elem is not None:
            cleartext_attr = app_elem.attrib.get(f"{{{ANDROID_NS}}}usesCleartextTraffic") or app_elem.attrib.get("usesCleartextTraffic")
            if cleartext_attr and cleartext_attr.lower() == "true":
                uses_cleartext_traffic = True

            # Check meta-data in application
            for meta in app_elem.findall("meta-data"):
                meta_name = meta.attrib.get(f"{{{ANDROID_NS}}}name") or meta.attrib.get("name") or ""
                if "car.application" in meta_name or "android.gms.car" in meta_name:
                    is_android_auto = True
                if "wearable.standalone" in meta_name or "android.wearable" in meta_name:
                    is_wear_os = True

            # Check services in application
            for srv in app_elem.findall("service"):
                srv_name = srv.attrib.get(f"{{{ANDROID_NS}}}name") or srv.attrib.get("name") or ""
                fgs_type = srv.attrib.get(f"{{{ANDROID_NS}}}foregroundServiceType") or srv.attrib.get("foregroundServiceType") or ""
                if "car" in srv_name.lower() or "carappservice" in srv_name.lower():
                    is_android_auto = True
                services.append({"name": srv_name, "foregroundServiceType": fgs_type})

        # Check uses-feature tags
        for feat in root.findall("uses-feature"):
            feat_name = feat.attrib.get(f"{{{ANDROID_NS}}}name") or feat.attrib.get("name")
            if feat_name:
                features.append(feat_name)
                if "automotive" in feat_name.lower() or "car" in feat_name.lower():
                    is_android_auto = True
                if "watch" in feat_name.lower():
                    is_wear_os = True

        # Check uses-permission tags
        for elem in root.findall("uses-permission"):
            perm_name = elem.attrib.get(f"{{{ANDROID_NS}}}name") or elem.attrib.get("name")
            if perm_name:
                short_name = perm_name.split(".")[-1]
                info = KNOWN_PERMISSIONS_RISK.get(short_name, {
                    "risk": "High" if any(k in short_name for k in ["LOCATION", "STORAGE", "CAMERA", "RECORD", "SMS", "PHONE", "SENSOR"]) else "Low",
                    "desc": f"Permission for {short_name.lower().replace('_', ' ')}.",
                    "guidance": "Verify compliance with Google Play Store target API and sensitive data policies.",
                    "justification": True if any(k in short_name for k in ["LOCATION", "STORAGE", "CAMERA", "RECORD", "SMS", "PHONE", "SENSOR"]) else False,
                })
                if "BODY_SENSORS" in short_name or "ACTIVITY_RECOGNITION" in short_name:
                    is_wear_os = True
                permissions.append({
                    "name": perm_name,
                    "risk": info["risk"],
                    "description": info["desc"],
                    "playStoreGuidance": info["guidance"],
                    "requiredJustification": info["justification"],
                })

    except Exception:
        # Fallback regex parsing if XML has non-standard namespace definitions
        pkg_match = re.search(r'package=["\']([^"\']+)["\']', xml_content)
        if pkg_match:
            package_name = pkg_match.group(1)
        target_match = re.search(r'android:targetSdkVersion=["\'](\d+)["\']', xml_content)
        if target_match:
            target_sdk = int(target_match.group(1))

        if 'android:usesCleartextTraffic="true"' in xml_content or "android:usesCleartextTraffic='true'" in xml_content:
            uses_cleartext_traffic = True

        if "com.google.android.gms.car.application" in xml_content or "android.hardware.type.automotive" in xml_content or "CarAppService" in xml_content:
            is_android_auto = True

        if "android.hardware.type.watch" in xml_content or "com.google.android.wearable.standalone" in xml_content:
            is_wear_os = True

        feat_matches = re.findall(r'<uses-feature[^>]+android:name=["\']([^"\']+)["\']', xml_content)
        for f in feat_matches:
            features.append(f)

        perm_matches = re.findall(r'<uses-permission[^>]+android:name=["\']([^"\']+)["\']', xml_content)
        for perm in perm_matches:
            short_name = perm.split(".")[-1]
            info = KNOWN_PERMISSIONS_RISK.get(short_name, {
                "risk": "High" if any(k in short_name for k in ["LOCATION", "STORAGE", "CAMERA", "RECORD", "SMS", "PHONE", "SENSOR"]) else "Low",
                "desc": f"Permission for {short_name.lower().replace('_', ' ')}.",
                "guidance": "Verify compliance with Google Play Store target API and sensitive data policies.",
                "justification": True if any(k in short_name for k in ["LOCATION", "STORAGE", "CAMERA", "RECORD", "SMS", "PHONE", "SENSOR"]) else False,
            })
            if "BODY_SENSORS" in short_name or "ACTIVITY_RECOGNITION" in short_name:
                is_wear_os = True
            permissions.append({
                "name": perm,
                "risk": info["risk"],
                "description": info["desc"],
                "playStoreGuidance": info["guidance"],
                "requiredJustification": info["justification"],
            })

    return {
        "packageName": package_name,
        "minSdkVersion": min_sdk,
        "targetSdkVersion": target_sdk,
        "permissions": permissions,
        "features": features,
        "services": services,
        "usesCleartextTraffic": uses_cleartext_traffic,
        "isAndroidAuto": is_android_auto,
        "isWearOS": is_wear_os,
    }
