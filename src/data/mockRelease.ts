export const activeProject = {
  name: "PulseFit Android",
  packageId: "com.pulsefit.mobile",
  platform: "Android",
  version: "2.4.0",
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

export const projects = [
  { name: "PulseFit Android", score: 82, platform: "Android", status: "Needs review" },
  { name: "MedTrack iOS", score: 91, platform: "iOS", status: "Ready" },
  { name: "CampusPay", score: 68, platform: "Android", status: "Blocked" },
];

export const testCases = [
  "Validate onboarding consent before analytics initialization.",
  "Verify camera permission denial fallback on profile upload.",
  "Confirm release build disables debug logging and test endpoints.",
];
