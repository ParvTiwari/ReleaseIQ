export type Platform =
  | "Android"
  | "iOS"
  | "Web & Extension"
  | "Windows Desktop"
  | "macOS Desktop"
  | "Amazon Appstore"
  | "Samsung Galaxy Store"
  | "Custom Policy";

export type ProjectStatus = "Ready" | "Needs review" | "Blocked";
export type Severity = "High" | "Medium" | "Low";
export type RuleStatus = "Passed" | "Warning" | "Blocked" | "Pending";

export type AppPage =
  | "dashboard"
  | "projects"
  | "app-details"
  | "uploads"
  | "compliance"
  | "test-cases"
  | "copy-review"
  | "reports"
  | "history"
  | "profile";

export type UserRole = "Project Owner" | "QA Reviewer" | "Legal Auditor" | "Mobile Engineer";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  avatarInitials: string;
  joinedDate: string;
  twoFactorEnabled?: boolean;
};

export type CustomPolicyRule = {
  id: string;
  category: string;
  ruleName: string;
  description: string;
  severity: Severity;
  status: RuleStatus;
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

export type ParsedPermission = {
  name: string;
  risk: Severity;
  description: string;
  playStoreGuidance?: string;
  requiredJustification?: boolean;
};

export type ManifestArtifact = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  uploadedAt: number;
  permissions: ParsedPermission[];
  targetSdkVersion?: number;
  minSdkVersion?: number;
};

export type PrivacyClauseCheck = {
  id: string;
  title: string;
  category: string;
  status: RuleStatus;
  detail: string;
  remediation?: string;
};

export type PrivacyPolicyArtifact = {
  fileName?: string;
  content?: string;
  uploadedAt: number;
  status: ProjectStatus;
  clauses: PrivacyClauseCheck[];
};

export type ComplianceFinding = {
  id: string;
  title: string;
  status: RuleStatus;
  severity: Severity;
  owner: string;
  detail: string;
  category?: string;
  guidelineRef?: string;
  remediation?: string;
};

export type TestCase = {
  id: string;
  title: string;
  area: "Smoke" | "Permissions" | "Location" | "Security" | "Privacy" | "Store Policy";
  priority: Severity;
  status: "Ready" | "Passed" | "Blocked" | "Needs review";
  steps?: string[];
  expectedResult?: string;
};

export type CopyFinding = {
  field: string;
  status: RuleStatus;
  note: string;
};

export type HistoryItem = {
  event: string;
  person: string;
  time: string;
  detail: string;
};

export type ComplianceRuleDefinition = {
  id: string;
  platform: "Android" | "iOS" | "Universal" | "Custom Policy";
  storeGuidelineRef: string;
  category: "Permissions" | "Privacy & Safety" | "Store Copy" | "Security & SDKs" | "Monetization";
  title: string;
  description: string;
  targetArtifact: "manifest" | "privacy_policy" | "app_metadata" | "custom_doc";
  severity: Severity;
  defaultStatus: RuleStatus;
  owner: "Legal" | "Android" | "iOS" | "Security" | "Product" | "QA";
  remediationGuide: string;
  docUrl: string;
  version?: string;
  effectiveDate?: string;
};
