import type { ComplianceFinding, ParsedPermission, PrivacyClauseCheck, TestCase } from "../types/release";

export interface LaymanFindingExplanation {
  plainTitle: string;
  whatWentWrong: string;
  whyItMatters: string;
  whoFixesIt: "Legal Team" | "Engineering (Mobile)" | "Product Manager" | "QA Team" | "Security Team";
  actionSteps: string[];
  storeImpact: "Critical: Immediate Store Rejection" | "High: Store Review Delay" | "Medium: Risk of Flagging" | "Low: Minor Notice" | "Safe: Compliant";
  estimatedEffort: string;
  jargonExplained?: { term: string; explanation: string }[];
}

/**
 * Translates technical compliance findings into layman, plain-English terms
 * easily understood by Product Managers, Business Stakeholders, and Non-Tech team members.
 */
export function explainComplianceFindingInLayman(finding: ComplianceFinding): LaymanFindingExplanation {
  const titleLower = (finding.title + " " + finding.detail + " " + (finding.remediation || "")).toLowerCase();

  // 1. Background Location
  if (titleLower.includes("background_location") || titleLower.includes("background location")) {
    return {
      plainTitle: "App Tracks User Location When Closed Without Clear Justification",
      whatWentWrong: "The app is asking for permission to track the user's physical GPS location even when the app is minimized or closed in the background.",
      whyItMatters: "Google Play and Apple strictly police background location. If you don't explain to users WHY the app needs this before asking, and submit a video proof in the Store Console, the app will be immediately rejected.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Product/Design: Prepare a short explanation screen in the app showing why background tracking benefits the user (e.g. 'Track your run while your phone is locked').",
        "Engineering: Show this popup BEFORE triggering the system GPS permission prompt.",
        "PM: Record a short 30-second screen recording demonstrating this feature and upload it in Google Play Console under 'App Content > Location Permissions'."
      ],
      storeImpact: "Critical: Immediate Store Rejection",
      estimatedEffort: "1 - 2 hours (Dev + PM Video)",
      jargonExplained: [
        { term: "ACCESS_BACKGROUND_LOCATION", explanation: "The system permission allowing the app to read GPS coordinates when the user isn't actively using the app." },
        { term: "Prominent In-App Disclosure", explanation: "A clear popup screen in plain language informing users why location data is needed before asking for permission." }
      ]
    };
  }

  // 2. Privacy Policy / Third-Party Data Sharing / Analytics
  if (titleLower.includes("privacy policy") || titleLower.includes("data sharing") || titleLower.includes("third-party") || titleLower.includes("crash reporting")) {
    return {
      plainTitle: "Privacy Policy Is Missing Names of Analytics or Crash Tracking Tools",
      whatWentWrong: "The app uses third-party developer tools (like Firebase, Sentry, or Mixpanel) to collect crash logs and analytics, but your privacy policy does not explicitly list their names or explain what data is sent to them.",
      whyItMatters: "App store reviewers compare the software code inside your app against your legal privacy policy. If the code sends data to tools not listed in the policy, your app is flagged for policy non-compliance.",
      whoFixesIt: "Legal Team",
      actionSteps: [
        "Legal/PM: Edit the company's Privacy Policy webpage (Section 4: Third-Party Service Providers).",
        "Add explicit sentences mentioning your tracking SDKs (e.g. 'We share diagnostic crash telemetry with Firebase Crashlytics and Sentry to improve stability.').",
        "Verify the updated privacy policy URL is live and accessible without a login."
      ],
      storeImpact: "High: Store Review Delay",
      estimatedEffort: "15 - 30 minutes (Document edit)",
      jargonExplained: [
        { term: "Third-party SDK", explanation: "Pre-built code packages from other companies (like Google Firebase, Facebook, Sentry) included in the app." },
        { term: "Data Safety Form", explanation: "The questionnaire you fill out in Google Play / Apple App Store declaring what user data is collected and shared." }
      ]
    };
  }

  // 3. Account Deletion
  if (titleLower.includes("account deletion") || titleLower.includes("delete account") || titleLower.includes("erasure")) {
    return {
      plainTitle: "Missing In-App or Web Account Deletion Option",
      whatWentWrong: "Users can create an account inside the app, but there is no easy button in Settings (or online web page) allowing them to permanently delete their account and associated data.",
      whyItMatters: "Both Apple and Google strictly require that if users can create an account in an app, they must also be able to delete it inside the app without having to email customer support.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Engineering: Add a 'Delete Account' button inside App Settings > Account Profile.",
        "PM: Ensure a public web page (e.g. https://yourapp.com/delete-account) exists with account deletion instructions for Google Play Console submission."
      ],
      storeImpact: "Critical: Immediate Store Rejection",
      estimatedEffort: "2 - 3 hours (API + UI flow)",
      jargonExplained: [
        { term: "Data Erasure Flow", explanation: "A self-service feature where users can trigger the permanent removal of their user profile and history." }
      ]
    };
  }

  // 4. Target SDK / OS Version
  if (titleLower.includes("targetsdk") || titleLower.includes("target sdk") || titleLower.includes("minimumosversion") || titleLower.includes("api level")) {
    return {
      plainTitle: "App Is Built for an Outdated Android or iOS System Version",
      whatWentWrong: "The app code is targeted for an older version of Android (below Android 14 / API 34) or iOS. Google and Apple enforce strict deadlines for supporting recent system updates.",
      whyItMatters: "Google Play will refuse to accept new app updates or new releases if the Target SDK level is below the required annual threshold.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Engineering: Open build configuration (build.gradle for Android or Xcode for iOS).",
        "Update 'targetSdkVersion' to 34 (Android 14) and re-test core user journeys for compatibility."
      ],
      storeImpact: "Critical: Immediate Store Rejection",
      estimatedEffort: "30 - 45 minutes",
      jargonExplained: [
        { term: "Target SDK 34", explanation: "The target system compatibility level (Android 14) that Google requires all apps to support starting late 2024/2026." }
      ]
    };
  }

  // 5. In-App Purchases / Billing
  if (titleLower.includes("billing") || titleLower.includes("in-app purchase") || titleLower.includes("storekit") || titleLower.includes("subscription")) {
    return {
      plainTitle: "In-App Purchases or Subscriptions Need Review",
      whatWentWrong: "Digital purchases or subscription paywalls are using outdated payment libraries or lack required restore purchase buttons and legal terms.",
      whyItMatters: "Apple and Google take 15-30% on digital goods and reject any app that attempts to bypass store payments, uses outdated billing libraries, or fails to show terms.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Engineering: Upgrade Google Play Billing Library to v6.2+ / StoreKit 2.",
        "Product/Design: Ensure the subscription paywall clearly displays subscription price, duration, and Terms of Service / Privacy Policy links."
      ],
      storeImpact: "Critical: Immediate Store Rejection",
      estimatedEffort: "1 - 2 hours",
      jargonExplained: [
        { term: "Google Play Billing Client", explanation: "Google's official library for handling credit card charges and subscriptions inside Android apps." }
      ]
    };
  }

  // 6. Sensitive Permissions / Photo & Storage Access
  if (titleLower.includes("storage") || titleLower.includes("photo") || titleLower.includes("read_media") || titleLower.includes("manage_external_storage")) {
    return {
      plainTitle: "App Requests Broad Access to All User Photos or Files",
      whatWentWrong: "The app is asking for wide permission to inspect all files/photos on the user's phone, instead of using the modern system photo selector.",
      whyItMatters: "Google Play bans broad storage permissions unless your app is a dedicated file manager or cloud backup tool. Regular apps will be rejected.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Engineering: Switch to the standard system 'Photo Picker' dialog (which doesn't require user permission prompts).",
        "Remove READ_MEDIA_IMAGES and MANAGE_EXTERNAL_STORAGE permissions from the manifest."
      ],
      storeImpact: "High: Store Review Delay",
      estimatedEffort: "1 hour",
      jargonExplained: [
        { term: "Android Photo Picker", explanation: "A secure system dialog where users select only the specific pictures they want to share with the app." }
      ]
    };
  }

  // 7. Security / Cleartext HTTP
  if (titleLower.includes("cleartext") || titleLower.includes("http") || titleLower.includes("tls") || titleLower.includes("security")) {
    return {
      plainTitle: "Unencrypted Internet Traffic (Non-HTTPS) Detected",
      whatWentWrong: "The app has configuration allowing it to send unencrypted plain HTTP internet traffic instead of secure encrypted HTTPS connections.",
      whyItMatters: "Unencrypted traffic can be intercepted by hackers on public Wi-Fi networks. Both Google and Apple reject apps allowing insecure HTTP connections.",
      whoFixesIt: "Security Team",
      actionSteps: [
        "Engineering: Ensure all backend API endpoints use https:// URLs.",
        "Disable 'usesCleartextTraffic' in Android manifest and enforce strict HTTPS encryption."
      ],
      storeImpact: "Critical: Immediate Store Rejection",
      estimatedEffort: "30 minutes",
      jargonExplained: [
        { term: "Cleartext Traffic", explanation: "Sending internet data in plain text without encryption, making it vulnerable to eavesdropping." }
      ]
    };
  }

  // 8. Sign in with Apple
  if (titleLower.includes("apple") && (titleLower.includes("sign in") || titleLower.includes("authentication"))) {
    return {
      plainTitle: "Missing 'Sign In with Apple' Button",
      whatWentWrong: "The app offers third-party social logins (like Google or Facebook Login) on iOS, but does not provide 'Sign in with Apple' alongside them.",
      whyItMatters: "Apple App Store Guideline 4.8 strictly mandates that if an iOS app supports Google, Facebook, or other social logins, it MUST also offer Sign in with Apple as an equal option.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Engineering: Add the native 'Sign in with Apple' button to the login/register screens on iOS.",
        "Configure Apple Developer Portal authentication service keys."
      ],
      storeImpact: "Critical: Immediate Store Rejection",
      estimatedEffort: "2 hours",
      jargonExplained: [
        { term: "Sign in with Apple", explanation: "Apple's privacy-focused single sign-on option required whenever other social logins are present." }
      ]
    };
  }

  // 9. Full Screen Intent / Alarms
  if (titleLower.includes("full_screen_intent") || titleLower.includes("alarm") || titleLower.includes("notification")) {
    return {
      plainTitle: "App Requests Permission to Interrupt User Screen Fullscreen",
      whatWentWrong: "The app declared a special permission to take over the user's phone screen with fullscreen popups even when the screen is locked.",
      whyItMatters: "Google Play reserves fullscreen interrupts exclusively for live phone calls and active timer/alarm apps. Any other app using it will be rejected.",
      whoFixesIt: "Engineering (Mobile)",
      actionSteps: [
        "Engineering: Remove USE_FULL_SCREEN_INTENT unless this app's primary feature is an alarm clock or video/audio calling.",
        "Use standard high-priority push notifications instead."
      ],
      storeImpact: "High: Store Review Delay",
      estimatedEffort: "30 minutes",
      jargonExplained: [
        { term: "Full Screen Intent", explanation: "A powerful Android capability that opens an app directly over the lockscreen without user tapping." }
      ]
    };
  }

  // Default Fallback with intelligent layman transformation
  const isBlocker = finding.status === "Blocked" || finding.severity === "High";
  return {
    plainTitle: finding.title.replace(/([A-Z_]{4,})/g, (match) => `"${match}"`),
    whatWentWrong: finding.detail || "A potential store compliance rule or configuration mismatch was detected.",
    whyItMatters: isBlocker
      ? "This issue violates standard Google Play / Apple App Store submission guidelines and will cause your release to be rejected during app review."
      : "While not an immediate rejection, this warning may cause app review delays, user privacy complaints, or follow-up questions from store inspectors.",
    whoFixesIt: finding.owner.toLowerCase().includes("legal")
      ? "Legal Team"
      : finding.owner.toLowerCase().includes("qa")
      ? "QA Team"
      : finding.owner.toLowerCase().includes("security")
      ? "Security Team"
      : finding.owner.toLowerCase().includes("product")
      ? "Product Manager"
      : "Engineering (Mobile)",
    actionSteps: finding.remediation
      ? [finding.remediation]
      : ["Review store guidelines for this item and update the configuration before submitting the build."],
    storeImpact: isBlocker ? "Critical: Immediate Store Rejection" : "Medium: Risk of Flagging",
    estimatedEffort: isBlocker ? "1 - 2 hours" : "15 - 30 minutes"
  };
}

/**
 * Translates technical device permissions into plain English user & business terms.
 */
export function explainPermissionInLayman(perm: ParsedPermission): {
  friendlyName: string;
  plainMeaning: string;
  userImpact: string;
  storePolicyNotes: string;
  riskBadgeColor: "rose" | "amber" | "emerald";
} {
  const name = perm.name.toUpperCase();

  if (name.includes("BACKGROUND_LOCATION")) {
    return {
      friendlyName: "📍 24/7 Background Location Tracking",
      plainMeaning: "Allows the app to read user GPS coordinates even when the phone is locked or the app is closed.",
      userImpact: "High battery impact and major privacy concern for users.",
      storePolicyNotes: "Requires in-app justification popup and video submission in Google Play Console.",
      riskBadgeColor: "rose",
    };
  }
  if (name.includes("FINE_LOCATION") || name.includes("LOCATION_WHEN_IN_USE")) {
    return {
      friendlyName: "📍 Precise GPS Location",
      plainMeaning: "Allows the app to determine the user's exact physical spot down to a few meters.",
      userImpact: "Users will be asked to grant 'Precise Location' upon opening location features.",
      storePolicyNotes: "Must ask permission only when user taps a location feature (e.g. Map, Nearby search).",
      riskBadgeColor: "rose",
    };
  }
  if (name.includes("COARSE_LOCATION")) {
    return {
      friendlyName: "📍 Approximate City/Area Location",
      plainMeaning: "Determines general city or neighborhood without pinpointing exact street address.",
      userImpact: "Low privacy concern; standard for weather or regional content.",
      storePolicyNotes: "Preferred by store reviewers over precise GPS when street accuracy is not needed.",
      riskBadgeColor: "amber",
    };
  }
  if (name.includes("CAMERA")) {
    return {
      friendlyName: "📷 Camera Access",
      plainMeaning: "Allows the app to take photos, scan QR codes, or stream video.",
      userImpact: "User must grant camera permission before opening camera viewfinder.",
      storePolicyNotes: "Must explain in plain words why camera is needed (e.g. 'Scan barcode' or 'Take profile picture').",
      riskBadgeColor: "amber",
    };
  }
  if (name.includes("MEDIA_IMAGES") || name.includes("READ_EXTERNAL_STORAGE")) {
    return {
      friendlyName: "🖼️ Photo Gallery Access",
      plainMeaning: "Allows app to view stored photos in the device gallery.",
      userImpact: "Can be intrusive if asking for all photos instead of using system picker.",
      storePolicyNotes: "Google Play mandates using the native Photo Picker instead of broad access.",
      riskBadgeColor: "rose",
    };
  }
  if (name.includes("RECORD_AUDIO") || name.includes("MICROPHONE")) {
    return {
      friendlyName: "🎙️ Microphone & Audio Recording",
      plainMeaning: "Allows the app to record sound and voice messages.",
      userImpact: "Users are sensitive to apps listening to microphone.",
      storePolicyNotes: "Must provide prominent explanation when microphone is active.",
      riskBadgeColor: "rose",
    };
  }
  if (name.includes("POST_NOTIFICATIONS")) {
    return {
      friendlyName: "🔔 Push Notifications",
      plainMeaning: "Allows the app to send alerts, reminders, and promotional badges to the notification shade.",
      userImpact: "User is asked 'Allow notifications?' on first launch or after onboarding.",
      storePolicyNotes: "Best practice: ask after user understands app value, not immediately on cold launch.",
      riskBadgeColor: "emerald",
    };
  }
  if (name.includes("FULL_SCREEN_INTENT")) {
    return {
      friendlyName: "⚡ Fullscreen Alarm / Call Takeover",
      plainMeaning: "Permits app to force a fullscreen alert over other apps even when phone is locked.",
      userImpact: "Very disruptive to user if used inappropriately.",
      storePolicyNotes: "Restricted strictly to alarm clocks and incoming VoIP/phone calling apps.",
      riskBadgeColor: "rose",
    };
  }
  if (name.includes("BLUETOOTH")) {
    return {
      friendlyName: "📶 Bluetooth & Nearby Devices",
      plainMeaning: "Allows connecting to nearby smartwatches, sensors, or fitness accessories.",
      userImpact: "Low risk when connecting to user-owned paired hardware.",
      storePolicyNotes: "Requires declaring whether Bluetooth is used to infer user location.",
      riskBadgeColor: "amber",
    };
  }

  // Fallback
  return {
    friendlyName: perm.name.replace("android.permission.", "").replace(/_/g, " "),
    plainMeaning: perm.description || "System permission requested for specific device functionality.",
    userImpact: perm.risk === "High" ? "Sensitive permission affecting user privacy or battery." : "Standard system access.",
    storePolicyNotes: "Review store policy requirements for sensitive hardware access.",
    riskBadgeColor: perm.risk === "High" ? "rose" : perm.risk === "Medium" ? "amber" : "emerald",
  };
}

/**
 * Translates privacy clauses into plain English explanations.
 */
export function explainPrivacyClauseInLayman(clause: PrivacyClauseCheck): {
  plainTitle: string;
  plainMeaning: string;
  pmTakeaway: string;
} {
  const title = clause.title.toLowerCase();

  if (title.includes("account deletion") || title.includes("delete")) {
    return {
      plainTitle: "🗑️ Account Deletion & User Data Erasure",
      plainMeaning: "The privacy policy tells users how they can permanently delete their account and wipe their personal records.",
      pmTakeaway: "Store Requirement: You must provide a self-service delete button in the app and a public web link.",
    };
  }
  if (title.includes("data sharing") || title.includes("third-party") || title.includes("processor")) {
    return {
      plainTitle: "📡 Third-Party Service Provider Sharing",
      plainMeaning: "Discloses every external company (e.g. Firebase, Mixpanel, AWS, Stripe) that receives user data.",
      pmTakeaway: "Ensure all analytics, crash tools, and ad networks used in the codebase are named in Section 4.",
    };
  }
  if (title.includes("data collection") || title.includes("types of data")) {
    return {
      plainTitle: "📋 What User Information Is Collected",
      plainMeaning: "Summarizes the specific items gathered (e.g. email address, name, GPS coordinates, device model).",
      pmTakeaway: "Must match what you check off in Google Play Console Data Safety questionnaire.",
    };
  }
  if (title.includes("children") || title.includes("age") || title.includes("coppa")) {
    return {
      plainTitle: "👶 Children's Privacy (COPPA & Family Policy)",
      plainMeaning: "Declares whether the app is intended for children under 13 and how minor data is protected.",
      pmTakeaway: "If targeting children, all ad SDKs must be Google Play Families-certified.",
    };
  }

  return {
    plainTitle: clause.title,
    plainMeaning: clause.detail,
    pmTakeaway: clause.remediation || "Standard privacy disclosure required by store review teams.",
  };
}
