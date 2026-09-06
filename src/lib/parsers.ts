import type {
  ComplianceFinding,
  ManifestArtifact,
  ParsedPermission,
  PrivacyClauseCheck,
  PrivacyPolicyArtifact,
  Project,
  Severity,
} from "../types/release";

export const KNOWN_PERMISSIONS_DATABASE: Record<
  string,
  {
    risk: Severity;
    desc: string;
    guidance: string;
    justification: boolean;
  }
> = {
  ACCESS_BACKGROUND_LOCATION: {
    risk: "High",
    desc: "Accesses device location continuously when app is in the background.",
    guidance: "Google Play requires prominent in-app disclosure dialog and declaration video approval.",
    justification: true,
  },
  ACCESS_FINE_LOCATION: {
    risk: "High",
    desc: "Accesses precise GPS device location for mapping and real-time positioning.",
    guidance: "Must prompt at runtime with feature-specific rationale before system dialog.",
    justification: true,
  },
  ACCESS_COARSE_LOCATION: {
    risk: "Medium",
    desc: "Accesses approximate network-derived device location.",
    guidance: "Prefer coarse location over fine location when precise GPS is non-essential.",
    justification: false,
  },
  MANAGE_EXTERNAL_STORAGE: {
    risk: "High",
    desc: "Grants broad all-files access across device shared storage.",
    guidance: "Google Play strictly restricts this to file managers, antivirus, and backup apps.",
    justification: true,
  },
  READ_MEDIA_IMAGES: {
    risk: "High",
    desc: "Reads photo and image files from shared storage on Android 13+.",
    guidance: "Google Play mandates migration to Android Photo Picker unless broad access is core.",
    justification: true,
  },
  READ_MEDIA_VIDEO: {
    risk: "High",
    desc: "Reads video files from shared storage on Android 13+.",
    guidance: "Use Android Photo Picker API instead of requesting broad media access.",
    justification: true,
  },
  READ_MEDIA_AUDIO: {
    risk: "Medium",
    desc: "Reads audio files from shared storage on Android 13+.",
    guidance: "Declare user-facing audio playback or editing feature rationale.",
    justification: true,
  },
  USE_FULL_SCREEN_INTENT: {
    risk: "High",
    desc: "Allows notification to take over full display during locked screen.",
    guidance: "Google Play limits this exclusively to live incoming calls and active timer alarms.",
    justification: true,
  },
  SCHEDULE_EXACT_ALARM: {
    risk: "High",
    desc: "Schedules exact-time alarm alarms with system wake lock.",
    guidance: "Restricted to calendar/alarm apps. Other apps must use WorkManager or setWindow().",
    justification: true,
  },
  USE_EXACT_ALARM: {
    risk: "Medium",
    desc: "Pre-granted exact alarm permission for primary clock and timer apps.",
    guidance: "Only available for core alarm clock and timer apps.",
    justification: true,
  },
  REQUEST_INSTALL_PACKAGES: {
    risk: "High",
    desc: "Allows requesting installation of package APKs directly.",
    guidance: "Restricted to verified app stores, enterprise device managers, and browser downloaders.",
    justification: true,
  },
  QUERY_ALL_PACKAGES: {
    risk: "High",
    desc: "Allows inspecting inventory of all installed apps on device.",
    guidance: "Play Store requires justification form. Search/antivirus apps only.",
    justification: true,
  },
  SYSTEM_ALERT_WINDOW: {
    risk: "High",
    desc: "Allows drawing floating overlay windows over other applications.",
    guidance: "Must justify why floating UI is essential to core app functionality.",
    justification: true,
  },
  CAMERA: {
    risk: "High",
    desc: "Captures photos and real-time video streams from camera sensors.",
    guidance: "Declare camera usage rationale. Must never access hardware in background.",
    justification: true,
  },
  RECORD_AUDIO: {
    risk: "High",
    desc: "Records audio streams from device microphones.",
    guidance: "Declare microphone usage rationale. Prominently notify user when recording.",
    justification: true,
  },
  BODY_SENSORS: {
    risk: "High",
    desc: "Accesses biometric sensors (heart rate, ECG, body temperature).",
    guidance: "Google Play Health & Fitness policy requires explicit Data Safety declarations.",
    justification: true,
  },
  BODY_SENSORS_BACKGROUND: {
    risk: "High",
    desc: "Continuous background monitoring of health biometric sensors.",
    guidance: "Mandates prominent in-app disclosure and Health Connect compliance.",
    justification: true,
  },
  ACTIVITY_RECOGNITION: {
    risk: "Medium",
    desc: "Detects user physical movement (walking, running, cycling, vehicle).",
    guidance: "Declare fitness or automatic trip detection feature rationale.",
    justification: true,
  },
  INTERNET: {
    risk: "Low",
    desc: "Opens standard network socket connections.",
    guidance: "Standard normal permission. Must comply with Data Safety HTTPS encryption.",
    justification: false,
  },
  ACCESS_NETWORK_STATE: {
    risk: "Low",
    desc: "Inspects cellular, Wi-Fi, and network availability state.",
    guidance: "Standard normal permission.",
    justification: false,
  },
  POST_NOTIFICATIONS: {
    risk: "Low",
    desc: "Sends push notifications on Android 13+ (API 33+).",
    guidance: "Standard runtime permission. Prompt after user engages with relevant features.",
    justification: false,
  },
  READ_PHONE_STATE: {
    risk: "High",
    desc: "Reads phone state, cellular network info, and incoming call status.",
    guidance: "Play Store restricts access. Avoid reading IMEI or hardware identifiers.",
    justification: true,
  },
  READ_CONTACTS: {
    risk: "High",
    desc: "Reads user personal address book and contact details.",
    guidance: "Must justify social or communication feature requirement in Play Console.",
    justification: true,
  },
};

export function parseAndroidManifestXml(
  xmlContent: string,
  fileName: string = "AndroidManifest.xml",
  fileSize: number = 0
): ManifestArtifact {
  let packageName = "com.releaseiq.app";
  let minSdk = 26;
  let targetSdk = 34;
  const permissions: ParsedPermission[] = [];
  const features: string[] = [];
  let usesCleartextTraffic = false;
  let isAndroidAuto = false;
  let isWearOS = false;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");

    const manifestElem = doc.querySelector("manifest");
    if (manifestElem) {
      packageName = manifestElem.getAttribute("package") || packageName;
    }

    const usesSdkElem = doc.querySelector("uses-sdk");
    if (usesSdkElem) {
      const minAttr = usesSdkElem.getAttribute("android:minSdkVersion") || usesSdkElem.getAttribute("minSdkVersion");
      const targetAttr = usesSdkElem.getAttribute("android:targetSdkVersion") || usesSdkElem.getAttribute("targetSdkVersion");
      if (minAttr) minSdk = parseInt(minAttr, 10) || minSdk;
      if (targetAttr) targetSdk = parseInt(targetAttr, 10) || targetSdk;
    }

    const appElem = doc.querySelector("application");
    if (appElem) {
      const cleartext = appElem.getAttribute("android:usesCleartextTraffic") || appElem.getAttribute("usesCleartextTraffic");
      if (cleartext === "true") usesCleartextTraffic = true;

      const metaTags = appElem.querySelectorAll("meta-data");
      metaTags.forEach((meta) => {
        const name = meta.getAttribute("android:name") || meta.getAttribute("name") || "";
        if (name.includes("car.application") || name.includes("android.gms.car")) isAndroidAuto = true;
        if (name.includes("wearable.standalone") || name.includes("android.wearable")) isWearOS = true;
      });

      const serviceTags = appElem.querySelectorAll("service");
      serviceTags.forEach((srv) => {
        const name = srv.getAttribute("android:name") || srv.getAttribute("name") || "";
        if (name.toLowerCase().includes("car") || name.toLowerCase().includes("carappservice")) isAndroidAuto = true;
      });
    }

    const featureTags = doc.querySelectorAll("uses-feature");
    featureTags.forEach((feat) => {
      const name = feat.getAttribute("android:name") || feat.getAttribute("name");
      if (name) {
        features.push(name);
        if (name.includes("automotive") || name.includes("car")) isAndroidAuto = true;
        if (name.includes("watch")) isWearOS = true;
      }
    });

    const permTags = doc.querySelectorAll("uses-permission");
    permTags.forEach((perm) => {
      const name = perm.getAttribute("android:name") || perm.getAttribute("name");
      if (name) {
        const shortName = name.split(".").pop() || name;
        const info = KNOWN_PERMISSIONS_DATABASE[shortName] || {
          risk: name.includes("LOCATION") || name.includes("STORAGE") || name.includes("CAMERA") ? "High" : "Low",
          desc: `Declared permission for ${shortName.toLowerCase().replace(/_/g, " ")}.`,
          guidance: "Verify compliance with Google Play Store target API and sensitive data policies.",
          justification: name.includes("LOCATION") || name.includes("STORAGE") || name.includes("CAMERA"),
        };
        if (shortName.includes("BODY_SENSORS") || shortName.includes("ACTIVITY_RECOGNITION")) {
          isWearOS = true;
        }
        permissions.push({
          name,
          risk: info.risk,
          description: info.desc,
          playStoreGuidance: info.guidance,
          requiredJustification: info.justification,
        });
      }
    });
  } catch {
    // Regex fallback
    const pkgMatch = xmlContent.match(/package=["']([^"']+)["']/);
    if (pkgMatch) packageName = pkgMatch[1];
    const targetMatch = xmlContent.match(/android:targetSdkVersion=["'](\d+)["']/);
    if (targetMatch) targetSdk = parseInt(targetMatch[1], 10);
    if (xmlContent.includes('android:usesCleartextTraffic="true"')) usesCleartextTraffic = true;
    if (xmlContent.includes("com.google.android.gms.car.application") || xmlContent.includes("CarAppService")) isAndroidAuto = true;
    if (xmlContent.includes("android.hardware.type.watch") || xmlContent.includes("wearable.standalone")) isWearOS = true;
  }

  return {
    name: fileName,
    size: fileSize || xmlContent.length,
    type: "application/xml",
    lastModified: Date.now(),
    uploadedAt: Date.now(),
    permissions,
    targetSdkVersion: targetSdk,
    minSdkVersion: minSdk,
    features,
    usesCleartextTraffic,
    isAndroidAuto,
    isWearOS,
  };
}

export function parseInfoPlistXml(
  plistContent: string,
  fileName: string = "Info.plist",
  fileSize: number = 0
): ManifestArtifact {
  const permissions: ParsedPermission[] = [];
  const features: string[] = [];
  let usesCleartextTraffic = false;
  let isCarPlay = false;
  let isWatchKit = false;

  const plistPermissionsMap: Record<string, { name: string; risk: Severity; desc: string; guidance: string; justification: boolean }> = {
    NSLocationWhenInUseUsageDescription: {
      name: "NSLocationWhenInUseUsageDescription",
      risk: "High",
      desc: "Foreground location access for real-time map and GPS navigation.",
      guidance: "App Store Guideline 5.1.1: Purpose string must clearly describe why location is needed.",
      justification: true,
    },
    NSLocationAlwaysAndWhenInUseUsageDescription: {
      name: "NSLocationAlwaysAndWhenInUseUsageDescription",
      risk: "High",
      desc: "Continuous background location tracking.",
      guidance: "Requires App Store justification video and prominent UI disclosure.",
      justification: true,
    },
    NSCameraUsageDescription: {
      name: "NSCameraUsageDescription",
      risk: "High",
      desc: "Captures photos and videos using the device camera.",
      guidance: "Clear purpose string required in Info.plist.",
      justification: true,
    },
    NSMicrophoneUsageDescription: {
      name: "NSMicrophoneUsageDescription",
      risk: "High",
      desc: "Audio recording and voice features.",
      guidance: "Must explain user benefit before triggering permission prompt.",
      justification: true,
    },
    NSUserTrackingUsageDescription: {
      name: "NSUserTrackingUsageDescription",
      risk: "High",
      desc: "App Tracking Transparency (ATT) framework identifier access.",
      guidance: "Mandatory if app links user data with third-party data for targeted advertising.",
      justification: true,
    },
    NSPhotoLibraryUsageDescription: {
      name: "NSPhotoLibraryUsageDescription",
      risk: "High",
      desc: "Access to user photo library.",
      guidance: "Use PHPickerViewController for modern out-of-process photo selection.",
      justification: true,
    },
    NSHealthShareUsageDescription: {
      name: "NSHealthShareUsageDescription",
      risk: "High",
      desc: "HealthKit biometric data reading.",
      guidance: "Apple Guideline 5.1.3: Health data cannot be shared with third parties for marketing.",
      justification: true,
    },
    NSBluetoothAlwaysUsageDescription: {
      name: "NSBluetoothAlwaysUsageDescription",
      risk: "Medium",
      desc: "Bluetooth peripheral connection and beacon detection.",
      guidance: "State accessory or sensor connection rationale.",
      justification: true,
    },
  };

  Object.entries(plistPermissionsMap).forEach(([key, info]) => {
    if (plistContent.includes(key)) {
      permissions.push({
        name: info.name,
        risk: info.risk,
        description: info.desc,
        playStoreGuidance: info.guidance,
        requiredJustification: info.justification,
      });
      if (key.includes("Health")) isWatchKit = true;
    }
  });

  if (plistContent.includes("NSAllowsArbitraryLoads") && plistContent.includes("<true/>")) {
    usesCleartextTraffic = true;
  }
  if (plistContent.includes("CPTemplateApplicationSceneDelegate") || plistContent.includes("CarPlay")) {
    isCarPlay = true;
  }
  if (plistContent.includes("WKCompanionAppBundleIdentifier") || plistContent.includes("WatchKit")) {
    isWatchKit = true;
  }

  return {
    name: fileName,
    size: fileSize || plistContent.length,
    type: "application/x-plist",
    lastModified: Date.now(),
    uploadedAt: Date.now(),
    permissions,
    targetSdkVersion: 18,
    minSdkVersion: 16,
    features,
    usesCleartextTraffic,
    isAndroidAuto: isCarPlay,
    isWearOS: isWatchKit,
  };
}

export function parsePrivacyPolicyText(
  text: string,
  fileName: string = "PrivacyPolicy.pdf"
): PrivacyPolicyArtifact {
  const clauses: PrivacyClauseCheck[] = [];
  const lower = text.toLowerCase();

  // 1. Data Collection
  if (lower.includes("collect") || lower.includes("personal information") || lower.includes("data")) {
    clauses.push({
      id: "clause-data-collect",
      title: "User Data Collection Categories",
      category: "Data Collection",
      status: "Passed",
      detail: "Specifies collected personal information, device telemetry, and usage patterns.",
    });
  } else {
    clauses.push({
      id: "clause-data-collect",
      title: "Missing Data Collection Disclosures",
      category: "Data Collection",
      status: "Blocked",
      detail: "Document must enumerate specific categories of user data collected by the application.",
      remediation: "Add a section listing collected data (e.g. email, location, telemetry, identifiers).",
    });
  }

  // 2. Account Deletion URL (§4.8)
  if (lower.includes("delete") || lower.includes("deletion") || lower.includes("remove account") || lower.includes("erase")) {
    clauses.push({
      id: "clause-user-rights",
      title: "Account & Data Deletion Portal URL (§4.8)",
      category: "User Rights",
      status: "Passed",
      detail: "Contains user rights clause and self-service account deletion workflow.",
    });
  } else {
    clauses.push({
      id: "clause-user-rights",
      title: "Mandatory Account Deletion Workflow (§4.8)",
      category: "User Rights",
      status: "Blocked",
      detail: "Google Play & Apple require a clear in-app account deletion mechanism and a public web deletion link.",
      remediation: "Provide dedicated web deletion URL (e.g. https://yourdomain.com/delete-account).",
    });
  }

  // 3. Third-Party Sharing
  if (lower.includes("third-party") || lower.includes("analytics") || lower.includes("share") || lower.includes("partners")) {
    clauses.push({
      id: "clause-third-party",
      title: "Third-Party Analytics & SDK Disclosures",
      category: "Third-Party Sharing",
      status: lower.includes("firebase") || lower.includes("crashlytics") || lower.includes("sentry") ? "Passed" : "Warning",
      detail: "Mentions third-party processors. Ensure all active analytics SDKs are explicitly named.",
      remediation: lower.includes("firebase") ? undefined : "Explicitly list vendor names (e.g. Firebase, Mixpanel, Sentry) in Section 4.",
    });
  } else {
    clauses.push({
      id: "clause-third-party",
      title: "Third-Party Data Sharing Clause Missing",
      category: "Third-Party Sharing",
      status: "Blocked",
      detail: "Must disclose whether data is shared with third-party advertising or analytics SDKs.",
      remediation: "Add clause explaining third-party SDK telemetry sharing.",
    });
  }

  // 4. Security & Encryption
  if (lower.includes("encrypt") || lower.includes("tls") || lower.includes("ssl") || lower.includes("security")) {
    clauses.push({
      id: "clause-retention",
      title: "Data Retention & Encryption Standards",
      category: "Retention & Security",
      status: "Passed",
      detail: "Specifies data retention lifecycle and in-transit HTTPS/TLS encryption guarantees.",
    });
  } else {
    clauses.push({
      id: "clause-retention",
      title: "Data Security & Encryption Declarations",
      category: "Retention & Security",
      status: "Warning",
      detail: "Recommended to explicitly state TLS in-transit and AES at-rest encryption standards.",
    });
  }

  return {
    fileName,
    content: text,
    uploadedAt: Date.now(),
    status: clauses.some((c) => c.status === "Blocked") ? "Needs review" : "Ready",
    clauses,
  };
}

export function evaluateClientCompliance(
  project: Project,
  manifest?: ManifestArtifact,
  privacyPolicy?: PrivacyPolicyArtifact
): { findings: ComplianceFinding[]; readinessScore: number; status: Project["status"] } {
  const findings: ComplianceFinding[] = [];
  const category = project.category || "";

  // 1. Manifest Checks
  if (!manifest || manifest.permissions.length === 0) {
    findings.push({
      id: "chk-manifest-missing",
      title: "AndroidManifest.xml Artifact Missing",
      status: "Blocked",
      severity: "High",
      owner: "Android Dev",
      detail: "No AndroidManifest.xml has been uploaded for permission and SDK level verification.",
      category: "Artifact Verification",
      guidelineRef: "Store Submission Readiness Standard §1.1",
      remediation: "Upload AndroidManifest.xml in the Uploads & Verification Center.",
    });
  } else {
    // Target SDK
    const targetSdk = manifest.targetSdkVersion ?? 34;
    if (targetSdk >= 34) {
      findings.push({
        id: "chk-target-sdk",
        title: `Target SDK ${targetSdk} (Android 14+) Compliance`,
        status: "Passed",
        severity: "High",
        owner: "Android Dev",
        detail: `App targets API ${targetSdk}, satisfying Google Play submission mandates.`,
        category: "Target API Level",
        guidelineRef: "Target API Level Requirements",
      });
    } else {
      findings.push({
        id: "chk-target-sdk",
        title: `Target SDK ${targetSdk} Below Play Store Mandate (API 34+)`,
        status: "Blocked",
        severity: "High",
        owner: "Android Dev",
        detail: `App targets API ${targetSdk}. Google Play requires targetSdkVersion >= 34.`,
        category: "Target API Level",
        guidelineRef: "Target API Level Requirements",
        remediation: "Upgrade targetSdkVersion to 34 or higher in build.gradle.",
      });
    }

    // Cleartext traffic
    if (manifest.usesCleartextTraffic) {
      findings.push({
        id: "chk-cleartext",
        title: "Cleartext HTTP Traffic Allowed (usesCleartextTraffic='true')",
        status: "Blocked",
        severity: "High",
        owner: "Security",
        detail: "Application allows insecure unencrypted HTTP network communication.",
        category: "Network Security",
        guidelineRef: "Google Play Network Security Policy",
        remediation: "Remove android:usesCleartextTraffic='true' and enforce TLS 1.3.",
      });
    } else {
      findings.push({
        id: "chk-cleartext",
        title: "Network TLS Encryption & In-Transit Security",
        status: "Passed",
        severity: "High",
        owner: "Security",
        detail: "Cleartext traffic disabled. Encrypted TLS 1.3 transport enforced.",
        category: "Network Security",
        guidelineRef: "Google Play Network Security Policy",
      });
    }

    // High risk permissions
    const permNames = manifest.permissions.map((p) => p.name);
    if (permNames.some((p) => p.includes("ACCESS_BACKGROUND_LOCATION"))) {
      findings.push({
        id: "chk-bg-location",
        title: "Background Location Justification Declaration (ACCESS_BACKGROUND_LOCATION)",
        status: "Blocked",
        severity: "High",
        owner: "Android / QA",
        detail: "ACCESS_BACKGROUND_LOCATION requires prominent in-app disclosure dialog and declaration video.",
        category: "Sensitive Permissions",
        guidelineRef: "Google Play Location Policy §2.1",
        remediation: "Add prominent in-app disclosure dialog before prompt and submit demo video in Play Console.",
      });
    }

    if (permNames.some((p) => p.includes("MANAGE_EXTERNAL_STORAGE"))) {
      findings.push({
        id: "chk-all-files",
        title: "All Files Access Policy (MANAGE_EXTERNAL_STORAGE)",
        status: "Blocked",
        severity: "High",
        owner: "Android Dev",
        detail: "Broad storage access is restricted exclusively to file management and backup tools.",
        category: "Sensitive Permissions",
        guidelineRef: "Google Play Storage Policy",
        remediation: "Migrate to Android Photo Picker or Scoped Storage.",
      });
    }

    if (permNames.some((p) => p.includes("USE_FULL_SCREEN_INTENT"))) {
      findings.push({
        id: "chk-fsi",
        title: "Full-Screen Notification Intent Restriction",
        status: "Blocked",
        severity: "High",
        owner: "Android Dev",
        detail: "USE_FULL_SCREEN_INTENT is restricted strictly to calling apps and timer alarms.",
        category: "Sensitive Permissions",
        guidelineRef: "Google Play Full Screen Intent Policy",
        remediation: "Remove USE_FULL_SCREEN_INTENT unless app core purpose is calling/alarms.",
      });
    }

    if (permNames.some((p) => p.includes("READ_MEDIA_IMAGES") || p.includes("READ_MEDIA_VIDEO"))) {
      findings.push({
        id: "chk-photo-picker",
        title: "Photo Picker API vs Broad Media Permissions",
        status: "Warning",
        severity: "Medium",
        owner: "Android Dev",
        detail: "Google Play mandates migration to Android Photo Picker instead of broad media access.",
        category: "Sensitive Permissions",
        guidelineRef: "Google Play Photo & Video Permissions Policy",
        remediation: "Adopt ActivityResultContracts.PickVisualMedia contract.",
      });
    }

    // Automotive / Android Auto Check
    const isAutoCategory = category.toLowerCase().includes("auto") || category.toLowerCase().includes("navigation");
    if (manifest.isAndroidAuto || isAutoCategory) {
      if (manifest.isAndroidAuto) {
        findings.push({
          id: "chk-auto-conformance",
          title: "Android Auto & CarPlay Capability Conformance",
          status: "Passed",
          severity: "High",
          owner: "Mobile QA",
          detail: "Android Auto descriptor metadata and CarAppService declarations detected.",
          category: "Crucial Category",
          guidelineRef: "Android Auto App Quality Guidelines",
        });
      } else {
        findings.push({
          id: "chk-auto-conformance",
          title: "Automotive Category Missing Android Auto Declaration",
          status: "Blocked",
          severity: "High",
          owner: "Android Dev",
          detail: "App is categorized under Navigation/Auto but lacks com.google.android.gms.car.application metadata.",
          category: "Crucial Category",
          guidelineRef: "Android for Cars Guidelines",
          remediation: "Add <meta-data android:name='com.google.android.gms.car.application' ... /> to AndroidManifest.xml.",
        });
      }
    }

    // Smart Watch / Wear OS Check
    const hasSensorPerms = permNames.some((p) => p.includes("BODY_SENSORS") || p.includes("ACTIVITY_RECOGNITION"));
    if (manifest.isWearOS || hasSensorPerms) {
      findings.push({
        id: "chk-wearable-sensors",
        title: "Smart Watch Sensor Analytics & Biometric Data Safety",
        status: "Passed",
        severity: "High",
        owner: "Wear Dev / Legal",
        detail: "Wear OS sensor declarations detected with Health Connect mapping verified.",
        category: "Crucial Category",
        guidelineRef: "Wear OS App Quality Policy",
      });
    }
  }

  // 2. Privacy Policy Checks
  if (!privacyPolicy || privacyPolicy.clauses.length === 0) {
    findings.push({
      id: "chk-privacy-missing",
      title: "Privacy Policy Document Missing",
      status: "Blocked",
      severity: "High",
      owner: "Legal",
      detail: "No Privacy Policy document has been uploaded for clause evaluation.",
      category: "Data Safety",
      guidelineRef: "Play Console User Data Policy §4.8",
      remediation: "Upload Privacy Policy document or paste text in Uploads & Verification Center.",
    });
  } else {
    for (const clause of privacyPolicy.clauses) {
      findings.push({
        id: `chk-${clause.id}`,
        title: clause.title,
        status: clause.status,
        severity: clause.title.toLowerCase().includes("deletion") ? "High" : "Medium",
        owner: "Legal",
        detail: clause.detail,
        category: clause.category,
        remediation: clause.remediation,
      });
    }
  }

  // Calculate score
  const total = findings.length;
  const passed = findings.filter((f) => f.status === "Passed").length;
  const blocked = findings.filter((f) => f.status === "Blocked").length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  const status: Project["status"] = blocked > 0 ? "Blocked" : score >= 80 ? "Ready" : "Needs review";

  return { findings, readinessScore: score, status };
}
