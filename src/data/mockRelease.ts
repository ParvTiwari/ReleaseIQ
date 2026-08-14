export type ProjectStatus = "Ready" | "Needs review" | "Blocked";

export type Platform =
  | "Android"
  | "iOS"
  | "Web & Extension"
  | "Windows Desktop"
  | "macOS Desktop"
  | "Amazon Appstore"
  | "Samsung Galaxy Store"
  | "Custom Policy";


export type CustomPolicyRule = {
  id: string;
  category: string;
  ruleName: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  status: "Passed" | "Warning" | "Blocked" | "Pending";
};

export type CustomPolicy = {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  policyName: string;
  presetId?: string;
  rules: CustomPolicyRule[];
};

export type Project = {
  id: string;
  name: string;
  packageId: string;
  version: string;
  category: string;
  releaseNotes: string;
  platform: Platform;
  description: string;
  releaseTarget: string;
  readinessScore: number;
  status: ProjectStatus;
  customPolicy?: CustomPolicy;
};

export const customPolicyPresets = [
  {
    id: "sec-baseline",
    name: "Enterprise Security Baseline v3.1",
    description: "Strict encryption, zero hardcoded tokens, API authentication checks, and dependency vulnerability scans.",
    rulesCount: 6,
    defaultRules: [
      { id: "r1", category: "Security", ruleName: "No cleartext HTTP traffic allowed", description: "Enforces TLS 1.3 across all backend endpoints", severity: "High" as const, status: "Passed" as const },
      { id: "r2", category: "Data Protection", ruleName: "PBR & PII Storage Sanitization", description: "Personal identifying info must be encrypted at rest", severity: "High" as const, status: "Passed" as const },
      { id: "r3", category: "Compliance", ruleName: "Third-party SDK Audit", description: "Only approved telemetry and analytics libraries are permitted", severity: "Medium" as const, status: "Warning" as const },
      { id: "r4", category: "Quality", ruleName: "Build Artifact Signature Verification", description: "Binaries must be cryptographically signed by authorized key", severity: "High" as const, status: "Passed" as const },
      { id: "r5", category: "Security", ruleName: "No hardcoded credentials or debug flags", description: "Inspect codebase for API keys, secret tokens, and debug bridges", severity: "High" as const, status: "Blocked" as const },
      { id: "r6", category: "Privacy", ruleName: "Explicit User Consent Dialogs", description: "Consent must be requested prior to data collection", severity: "Medium" as const, status: "Passed" as const },
    ],
  },
  {
    id: "gdpr-hipaa",
    name: "HIPAA & Healthcare Data Governance",
    description: "Medical records privacy, audit logging, strict access control, and user data deletion compliance.",
    rulesCount: 5,
    defaultRules: [
      { id: "r10", category: "Privacy", ruleName: "Audit log retention for patient access", description: "All health metric interactions must record timestamped logs", severity: "High" as const, status: "Passed" as const },
      { id: "r11", category: "Data Protection", ruleName: "End-to-End Payload Encryption", description: "Medical telemetry must use AES-256 GCM encryption", severity: "High" as const, status: "Passed" as const },
      { id: "r12", category: "Compliance", ruleName: "Right-to-be-forgotten API Endpoint", description: "User account deletion must purge health history within 30 days", severity: "High" as const, status: "Warning" as const },
      { id: "r13", category: "Security", ruleName: "Biometric Authentication Gate", description: "Require TouchID/FaceID or PIN before viewing health records", severity: "Medium" as const, status: "Passed" as const },
      { id: "r14", category: "Governance", ruleName: "BAA Vendor Agreement Verification", description: "Ensure third-party integrations maintain active BAA sign-offs", severity: "Medium" as const, status: "Passed" as const },
    ],
  },
  {
    id: "fintech-soc2",
    name: "Fintech & SOC2 Data Safeguards",
    description: "Financial transaction integrity, PCI-DSS compliance, tokenized payment gateways, and rate limiting.",
    rulesCount: 4,
    defaultRules: [
      { id: "r20", category: "Finance", ruleName: "Payment Card Tokenization", description: "Raw credit card data must never touch application servers", severity: "High" as const, status: "Passed" as const },
      { id: "r21", category: "Security", ruleName: "API Rate Limiting & Anti-Fraud Headers", description: "Prevent brute-force authentication and request flooding", severity: "High" as const, status: "Passed" as const },
      { id: "r22", category: "Compliance", ruleName: "Anti-Money Laundering (AML) Disclosure", description: "Customer identity verification flow required for transactions > $1k", severity: "High" as const, status: "Blocked" as const },
      { id: "r23", category: "Audit", ruleName: "Immutable Financial Ledger Signatures", description: "Transaction history must be cryptographically hashed", severity: "Medium" as const, status: "Passed" as const },
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
  { label: "Open blockers", value: "5", detail: "2 high severity" },
  { label: "Custom rules active", value: "15", detail: "3 uploaded policy files" },
];

export const checks = [
  {
    title: "Privacy policy data sharing clause",
    status: "Warning",
    severity: "Medium",
    owner: "Legal",
  },
  {
    title: "Background location permission justification",
    status: "Blocked",
    severity: "High",
    owner: "Android",
  },
  {
    title: "Release notes and version code",
    status: "Passed",
    severity: "Low",
    owner: "QA",
  },
  {
    title: "Play Store sensitive permissions",
    status: "Warning",
    severity: "Medium",
    owner: "Security",
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

export const testCases = [
  "Validate onboarding consent before analytics initialization.",
  "Verify camera permission denial fallback on profile upload.",
  "Confirm release build disables debug logging and test endpoints.",
];

