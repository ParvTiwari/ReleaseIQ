import type {
  ComplianceFinding,
  CopyFinding,
  CustomPolicy,
  CustomPolicyRule,
  HistoryItem,
  ManifestArtifact,
  Platform,
  PrivacyPolicyArtifact,
  Project,
  ProjectStatus,
  TestCase,
} from "../types/release";
import { defaultMockPermissions, defaultPrivacyClauses } from "./complianceRules";

export type {
  ComplianceFinding,
  CopyFinding,
  CustomPolicy,
  CustomPolicyRule,
  HistoryItem,
  ManifestArtifact,
  Platform,
  PrivacyPolicyArtifact,
  Project,
  ProjectStatus,
  TestCase,
};

export const customPolicyPresets: Array<{
  id: string;
  name: string;
  description: string;
  rulesCount: number;
  defaultRules: CustomPolicyRule[];
}> = [
  {
    id: "sec-baseline",
    name: "Enterprise Security Baseline v3.1",
    description: "Strict encryption, zero hardcoded tokens, API authentication checks, and dependency vulnerability scans.",
    rulesCount: 6,
    defaultRules: [
      { id: "r1", category: "Security", ruleName: "No cleartext HTTP traffic allowed", description: "Enforces TLS 1.3 across all backend endpoints", severity: "High", status: "Passed" },
      { id: "r2", category: "Data Protection", ruleName: "PBR & PII Storage Sanitization", description: "Personal identifying info must be encrypted at rest", severity: "High", status: "Passed" },
      { id: "r3", category: "Compliance", ruleName: "Third-party SDK Audit", description: "Only approved telemetry and analytics libraries are permitted", severity: "Medium", status: "Warning" },
      { id: "r4", category: "Quality", ruleName: "Build Artifact Signature Verification", description: "Binaries must be cryptographically signed by authorized key", severity: "High", status: "Passed" },
      { id: "r5", category: "Security", ruleName: "No hardcoded credentials or debug flags", description: "Inspect codebase for API keys, secret tokens, and debug bridges", severity: "High", status: "Blocked" },
      { id: "r6", category: "Privacy", ruleName: "Explicit User Consent Dialogs", description: "Consent must be requested prior to data collection", severity: "Medium", status: "Passed" },
    ],
  },
  {
    id: "gdpr-hipaa",
    name: "HIPAA & Healthcare Data Governance",
    description: "Medical records privacy, audit logging, strict access control, and user data deletion compliance.",
    rulesCount: 5,
    defaultRules: [
      { id: "r10", category: "Privacy", ruleName: "Audit log retention for patient access", description: "All health metric interactions must record timestamped logs", severity: "High", status: "Passed" },
      { id: "r11", category: "Data Protection", ruleName: "End-to-End Payload Encryption", description: "Medical telemetry must use AES-256 GCM encryption", severity: "High", status: "Passed" },
      { id: "r12", category: "Compliance", ruleName: "Right-to-be-forgotten API Endpoint", description: "User account deletion must purge health history within 30 days", severity: "High", status: "Warning" },
      { id: "r13", category: "Security", ruleName: "Biometric Authentication Gate", description: "Require TouchID/FaceID or PIN before viewing health records", severity: "Medium", status: "Passed" },
      { id: "r14", category: "Governance", ruleName: "BAA Vendor Agreement Verification", description: "Ensure third-party integrations maintain active BAA sign-offs", severity: "Medium", status: "Passed" },
    ],
  },
  {
    id: "fintech-soc2",
    name: "Fintech & SOC2 Data Safeguards",
    description: "Financial transaction integrity, PCI-DSS compliance, tokenized payment gateways, and rate limiting.",
    rulesCount: 4,
    defaultRules: [
      { id: "r20", category: "Finance", ruleName: "Payment Card Tokenization", description: "Raw credit card data must never touch application servers", severity: "High", status: "Passed" },
      { id: "r21", category: "Security", ruleName: "API Rate Limiting & Anti-Fraud Headers", description: "Prevent brute-force authentication and request flooding", severity: "High", status: "Passed" },
      { id: "r22", category: "Compliance", ruleName: "Anti-Money Laundering (AML) Disclosure", description: "Customer identity verification flow required for transactions > $1k", severity: "High", status: "Blocked" },
      { id: "r23", category: "Audit", ruleName: "Immutable Financial Ledger Signatures", description: "Transaction history must be cryptographically hashed", severity: "Medium", status: "Passed" },
    ],
  },
];

export const activeProject: Project = {
  id: "pulsefit-android",
  name: "PulseFit Android",
  packageId: "com.pulsefit.mobile",
  version: "2.4.0",
  category: "Health & Fitness",
  releaseNotes: "Improved workout plans, refined activity tracking, and stability fixes.",
  platform: "Android",
  description: "Fitness coaching and activity tracking app for Android.",
  releaseTarget: "Aug 18, 2026",
  readinessScore: 82,
  status: "Needs review",
};

export const dashboardStats = [
  { label: "Active projects", value: "8", detail: "+2 this month" },
  { label: "Avg readiness", value: "84%", detail: "Across all platforms" },
  { label: "Open blockers", value: "3", detail: "1 high severity" },
  { label: "Custom rules active", value: "15", detail: "3 uploaded policy files" },
];

export const checks: ComplianceFinding[] = [
  {
    id: "chk-1",
    title: "Privacy policy data sharing clause",
    status: "Warning",
    severity: "Medium",
    owner: "Legal",
    detail: "Analytics sharing needs final wording regarding third-party crash reporting vendors.",
    remediation: "Add explicit third-party processor names in Section 4 of the privacy policy.",
  },
  {
    id: "chk-2",
    title: "Background location permission justification",
    status: "Blocked",
    severity: "High",
    owner: "Android",
    detail: "ACCESS_BACKGROUND_LOCATION is declared in manifest but lacks clear user justification.",
    remediation: "Include prominent disclosure dialog prior to permission request and submit demo video in Play Console.",
  },
  {
    id: "chk-3",
    title: "Release notes and version code",
    status: "Passed",
    severity: "Low",
    owner: "QA",
    detail: "Version code matches repository tag and notes are formatted accurately.",
  },
  {
    id: "chk-4",
    title: "Play Store sensitive permissions declaration",
    status: "Warning",
    severity: "Medium",
    owner: "Security",
    detail: "Camera and photo library access need verified runtime fallbacks.",
  },
];

export const projects: Project[] = [
  activeProject,
  {
    id: "medtrack-ios",
    name: "MedTrack iOS",
    packageId: "com.medtrack.ios",
    version: "3.8.1",
    category: "Medical",
    releaseNotes: "Added medication schedule reminders and accessibility improvements.",
    platform: "iOS",
    description: "Medication reminders and appointment tracking for iPhone users.",
    releaseTarget: "Sep 2, 2026",
    readinessScore: 91,
    status: "Ready",
  },
  {
    id: "enterprise-custom-policy",
    name: "Enterprise Cloud Vault",
    packageId: "org.internal.vault.suite",
    version: "4.1.0-rc2",
    category: "Productivity",
    releaseNotes: "Internal enterprise cloud storage with uploaded corporate policy compliance verification.",
    platform: "Custom Policy",
    description: "Self-hosted corporate storage app evaluated against uploaded enterprise security rules.",
    releaseTarget: "Aug 29, 2026",
    readinessScore: 78,
    status: "Needs review",
    customPolicy: {
      fileName: "Corp-Security-Policy-2026.pdf",
      fileSize: "1.4 MB",
      uploadDate: "Aug 14, 2026",
      policyName: "Enterprise Security Baseline v3.1",
      presetId: "sec-baseline",
      rules: customPolicyPresets[0].defaultRules,
    },
  },
  {
    id: "chrome-web-extension",
    name: "ReleaseIQ Web Extension",
    packageId: "ext.releaseiq.browser",
    version: "1.2.0",
    category: "Utilities",
    releaseNotes: "Chrome & Edge web extension for quick release verification in developer console.",
    platform: "Web & Extension",
    description: "Browser extension deployed to Chrome Web Store and Edge Add-ons.",
    releaseTarget: "Sep 10, 2026",
    readinessScore: 95,
    status: "Ready",
  },
  {
    id: "campuspay-android",
    name: "CampusPay",
    packageId: "com.campuspay.mobile",
    version: "1.9.0",
    category: "Finance",
    releaseNotes: "Improved campus payment confirmation and transaction history.",
    platform: "Android",
    description: "Campus payments and student account management app.",
    releaseTarget: "Aug 25, 2026",
    readinessScore: 68,
    status: "Blocked",
  },
  {
    id: "gamesphere-amazon",
    name: "GameSphere HD",
    packageId: "com.gamesphere.amazon",
    version: "2.0.5",
    category: "Games",
    releaseNotes: "Cross-platform cloud gaming hub optimized for Amazon Fire Tablet and TV.",
    platform: "Amazon Appstore",
    description: "Gaming catalog app built for Fire OS & Amazon Appstore deployment.",
    releaseTarget: "Sep 15, 2026",
    readinessScore: 88,
    status: "Ready",
  },
];

export const initialManifests: Record<string, ManifestArtifact> = {
  "pulsefit-android": {
    name: "AndroidManifest.xml",
    size: 4280,
    type: "application/xml",
    lastModified: 1723700000000,
    uploadedAt: 1723700000000,
    permissions: defaultMockPermissions,
    targetSdkVersion: 34,
    minSdkVersion: 26,
  },
};

export const initialPrivacyPolicies: Record<string, PrivacyPolicyArtifact> = {
  "pulsefit-android": {
    fileName: "PulseFit-Privacy-Policy-v2.pdf",
    uploadedAt: 1723700000000,
    status: "Needs review",
    clauses: defaultPrivacyClauses,
  },
};

export const initialTestCases: TestCase[] = [
  {
    id: "tc-1",
    title: "Install clean release build on Android 15 (Target SDK 34)",
    priority: "High",
    area: "Smoke",
    status: "Ready",
    steps: ["Deploy AAB to Android 15 test device", "Verify app cold launch under 1.5s", "Verify no crash on first boot"],
    expectedResult: "App initializes clean dashboard without native bridge exceptions.",
  },
  {
    id: "tc-2",
    title: "Deny camera permission during profile avatar upload",
    priority: "Medium",
    area: "Permissions",
    status: "Ready",
    steps: ["Navigate to User Profile", "Tap avatar camera icon", "Tap 'Don't Allow' on system runtime prompt"],
    expectedResult: "App displays polite in-app explanation and gracefully falls back to default avatar.",
  },
  {
    id: "tc-3",
    title: "Start workout session with background location disabled",
    priority: "High",
    area: "Location",
    status: "Needs review",
    steps: ["Revoke 'Allow all the time' location in OS settings", "Start GPS Outdoor Run workout"],
    expectedResult: "App displays prominent in-app disclosure explaining why GPS distance requires location access.",
  },
  {
    id: "tc-4",
    title: "Verify release build hides debug endpoints and test logging",
    priority: "High",
    area: "Security",
    status: "Ready",
    steps: ["Inspect logcat output during network request", "Verify debug menu trigger is disabled in production binary"],
    expectedResult: "Zero auth tokens or test backend URLs are printed in standard device logs.",
  },
  {
    id: "tc-5",
    title: "Validate user consent prompt before analytics SDK initialization",
    priority: "High",
    area: "Privacy",
    status: "Ready",
    steps: ["Perform fresh app install", "Monitor outgoing telemetry packets prior to clicking 'Accept & Continue'"],
    expectedResult: "No telemetry or ad-identifier requests are dispatched before explicit consent.",
  },
];

export const testCases = initialTestCases.map((tc) => tc.title);

export const copyFindings: CopyFinding[] = [
  { field: "Short description", status: "Passed", note: "Clear value proposition (78 chars) within store 80-character limit." },
  { field: "Full description", status: "Warning", note: "Claims regarding 'medical diagnosis' require disclaimer in Health category." },
  { field: "Release notes", status: "Passed", note: "Scannable, bulleted, and version-specific." },
  { field: "Permission rationale", status: "Blocked", note: "Background location rationale text needs to explicitly describe workout route tracking." },
];

export const historyItems: HistoryItem[] = [
  { event: "Readiness scan completed", person: "ReleaseIQ Engine", time: "Today at 10:45 AM", detail: "Found 1 high blocker (Background location) and 2 warnings." },
  { event: "Manifest uploaded", person: "Parv Tiwari", time: "Aug 15, 2026", detail: "Parsed AndroidManifest.xml — 4 permissions detected." },
  { event: "Privacy policy validated", person: "Legal Team", time: "Aug 14, 2026", detail: "Evaluated 4 data safety clauses against Google Play policy." },
  { event: "Release project created", person: "Parth Gupta", time: "Aug 12, 2026", detail: "Targeting Android Google Play Store release for Aug 18, 2026." },
];
