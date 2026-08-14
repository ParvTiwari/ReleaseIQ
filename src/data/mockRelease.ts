export type ProjectStatus = "Ready" | "Needs review" | "Blocked";

export type Project = {
  id: string;
  name: string;
  packageId: string;
  version: string;
  category: string;
  releaseNotes: string;
  platform: "Android" | "iOS";
  description: string;
  releaseTarget: string;
  readinessScore: number;
  status: ProjectStatus;
};

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
  { label: "Avg readiness", value: "84%", detail: "Across Android builds" },
  { label: "Open blockers", value: "5", detail: "2 high severity" },
  { label: "Generated tests", value: "128", detail: "31 security checks" },
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
];

export const testCases = [
  "Validate onboarding consent before analytics initialization.",
  "Verify camera permission denial fallback on profile upload.",
  "Confirm release build disables debug logging and test endpoints.",
];
