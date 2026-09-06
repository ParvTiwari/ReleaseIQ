import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { NewProjectFields } from "../components/NewProjectModal";
import {
  checks as initialChecks,
  initialManifests,
  initialPrivacyPolicies,
  initialTestCases,
  projects as initialProjects,
} from "../data/mockRelease";
import { notifyToast } from "../lib/alerts";
import { api } from "../lib/api";
import { evaluateClientCompliance } from "../lib/parsers";
import type {
  AiAuditResult,
  AssetItem,
  ComplianceFinding,
  CustomPolicyRule,
  HistoryItem,
  ManifestArtifact,
  NotificationItem,
  Platform,
  PrivacyPolicyArtifact,
  Project,
  RuleStatus,
  TestCase,
} from "../types/release";

interface ReleaseContextType {
  projects: Project[];
  activeProjectId: string;
  activeProject: Project;
  selectProject: (projectId: string) => void;
  createProject: (fields: NewProjectFields) => Promise<void>;
  saveAppDetails: (details: Partial<Project>) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  cloneProject: (sourceProjectId: string, newPlatform?: Platform) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  manifestsByProject: Record<string, ManifestArtifact | undefined>;
  privacyPoliciesByProject: Record<string, PrivacyPolicyArtifact | undefined>;
  complianceByProject: Record<string, ComplianceFinding[]>;
  testCasesByProject: Record<string, TestCase[]>;
  customRulesByProject: Record<string, CustomPolicyRule[]>;
  assetsByProject: Record<string, AssetItem[]>;
  historyByProject: Record<string, HistoryItem[]>;
  activeManifest?: ManifestArtifact;
  activePrivacyPolicy?: PrivacyPolicyArtifact;
  activeCompliance: ComplianceFinding[];
  activeTestCases: TestCase[];
  activeCustomRules: CustomPolicyRule[];
  activeAssets: AssetItem[];
  activeHistory: HistoryItem[];
  notifications: NotificationItem[];
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  handleMarkAllNotificationsAsRead: () => void;
  openBlockersCount: number;
  handleUploadManifest: (manifest: ManifestArtifact) => Promise<void>;
  handleUploadPrivacyPolicy: (policy: PrivacyPolicyArtifact) => Promise<void>;
  handleToggleTestCaseStatus: (testCaseId: string) => Promise<void>;
  handleAddTestCase: (testCase: TestCase) => Promise<void>;
  handleUpdateTestCase: (testCase: TestCase) => Promise<void>;
  handleDeleteTestCase: (testCaseId: string) => Promise<void>;
  handleToggleComplianceStatus: (checkId: string) => Promise<void>;
  handleToggleCustomRuleStatus: (ruleId: string) => void;
  handleAddCustomRule: (rule: CustomPolicyRule) => void;
  handleAddAsset: (asset: AssetItem) => void;
  handleDeleteAsset: (assetId: string) => void;
  handleAddHistoryItem: (item: HistoryItem) => void;
  handleRunAiAudit: () => Promise<AiAuditResult | null>;
  isNewProjectOpen: boolean;
  setIsNewProjectOpen: (open: boolean) => void;
  isLoading: boolean;
}

const ReleaseContext = createContext<ReleaseContextType | undefined>(undefined);

const defaultInitialHistory: Record<string, HistoryItem[]> = {
  "pulsefit-android": [
    {
      event: "Release Readiness Assessment Generated",
      person: "ReleaseIQ Automated Engine",
      time: "Today, 11:45 AM",
      detail: "Evaluated store compliance rules against AndroidManifest.xml and Data Safety policy.",
    },
    {
      event: "AndroidManifest.xml Analyzed",
      person: "Parv Tiwari (Project Owner)",
      time: "Aug 15, 2026",
      detail: "Parsed AndroidManifest.xml — 4 permissions detected.",
    },
    {
      event: "Privacy Policy Validated",
      person: "Legal Team",
      time: "Aug 14, 2026",
      detail: "Evaluated 4 data safety clauses against Google Play policy.",
    },
    {
      event: "Release Suite Initialized",
      person: "Parv Tiwari",
      time: "Aug 12, 2026",
      detail: "Created Android release project targeting Google Play Store release.",
    },
  ],
};

const defaultInitialAssets: Record<string, AssetItem[]> = {
  "pulsefit-android": [
    { id: "a1", name: "release-aab-2.4.0.aab", type: "Android App Bundle (AAB)", size: "84.2 MB", status: "Ready", uploadedAt: Date.now() - 3600000 },
    { id: "a2", name: "store-screenshots.zip", type: "Store Phone Screenshots", size: "18.7 MB", status: "Needs review", uploadedAt: Date.now() - 7200000 },
    { id: "a3", name: "feature-graphic.png", type: "Google Play Feature Graphic (1024x500)", size: "1.2 MB", status: "Ready", uploadedAt: Date.now() - 86400000 },
  ],
};

export function ReleaseProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProjects[0].id);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Per-project stores
  const [manifestsByProject, setManifestsByProject] = useState<Record<string, ManifestArtifact | undefined>>(initialManifests);
  const [privacyPoliciesByProject, setPrivacyPoliciesByProject] = useState<Record<string, PrivacyPolicyArtifact | undefined>>(initialPrivacyPolicies);
  const [complianceByProject, setComplianceByProject] = useState<Record<string, ComplianceFinding[]>>({
    "pulsefit-android": initialChecks,
  });
  const [testCasesByProject, setTestCasesByProject] = useState<Record<string, TestCase[]>>({
    "pulsefit-android": initialTestCases,
  });
  const [customRulesByProject, setCustomRulesByProject] = useState<Record<string, CustomPolicyRule[]>>({});
  const [assetsByProject, setAssetsByProject] = useState<Record<string, AssetItem[]>>(defaultInitialAssets);
  const [historyByProject, setHistoryByProject] = useState<Record<string, HistoryItem[]>>(defaultInitialHistory);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  // 1. Initial Load: Fetch live projects from backend
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const liveProjects = await api.projects.list();
        if (liveProjects && liveProjects.length > 0) {
          setProjects(liveProjects);
          setActiveProjectId(liveProjects[0].id);
        }
      } catch {
        // Fallback to local memory stores
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch project details when active project changes
  useEffect(() => {
    if (!activeProjectId) return;

    const fetchProjectDetails = async () => {
      try {
        const [liveCompliance, liveTests, liveManifest, livePolicy] = await Promise.allSettled([
          api.compliance.list(activeProjectId),
          api.testCases.list(activeProjectId),
          api.artifacts.getManifest(activeProjectId),
          api.artifacts.getPrivacyPolicy(activeProjectId),
        ]);

        if (liveCompliance.status === "fulfilled" && liveCompliance.value.length > 0) {
          setComplianceByProject((prev) => ({ ...prev, [activeProjectId]: liveCompliance.value }));
        }
        if (liveTests.status === "fulfilled") {
          setTestCasesByProject((prev) => ({ ...prev, [activeProjectId]: liveTests.value }));
        }
        if (liveManifest.status === "fulfilled") {
          setManifestsByProject((prev) => ({ ...prev, [activeProjectId]: liveManifest.value || undefined }));
        }
        if (livePolicy.status === "fulfilled") {
          setPrivacyPoliciesByProject((prev) => ({ ...prev, [activeProjectId]: livePolicy.value || undefined }));
        }
      } catch {
        // Fallback to local memory stores
      }
    };

    fetchProjectDetails();
  }, [activeProjectId]);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? initialProjects[0];
  const activeManifest = manifestsByProject[activeProjectId];
  const activePrivacyPolicy = privacyPoliciesByProject[activeProjectId];
  const activeCompliance = complianceByProject[activeProjectId] ?? [];
  const activeTestCases = testCasesByProject[activeProjectId] ?? [];
  const activeCustomRules = customRulesByProject[activeProjectId] ?? activeProject.customPolicy?.rules ?? [];
  const activeAssets = assetsByProject[activeProjectId] ?? [];
  const activeHistory = historyByProject[activeProjectId] ?? [];

  const openBlockersCount = activeProject.platform === "Custom Policy"
    ? activeCustomRules.filter((r) => r.status === "Blocked").length
    : activeCompliance.filter((c) => c.status === "Blocked").length;

  // Dynamic notification items generated from real state
  const notifications: NotificationItem[] = [
    ...activeCompliance
      .filter((c) => c.status === "Blocked")
      .map((c) => ({
        id: `notif-${c.id}`,
        title: `Release Blocker: ${c.title}`,
        message: c.detail,
        type: "blocker" as const,
        timestamp: Date.now(),
        read: readNotificationIds.has(`notif-${c.id}`),
        link: "/compliance",
      })),
    ...(!activeManifest
      ? [
          {
            id: `notif-missing-manifest-${activeProjectId}`,
            title: "Action Required: AndroidManifest.xml Missing",
            message: "Upload AndroidManifest.xml to evaluate target SDK and sensitive permissions.",
            type: "warning" as const,
            timestamp: Date.now(),
            read: readNotificationIds.has(`notif-missing-manifest-${activeProjectId}`),
            link: "/uploads",
          },
        ]
      : []),
    ...(!activePrivacyPolicy
      ? [
          {
            id: `notif-missing-policy-${activeProjectId}`,
            title: "Action Required: Privacy Policy Missing",
            message: "Upload or paste your Privacy Policy to audit required data safety clauses.",
            type: "warning" as const,
            timestamp: Date.now(),
            read: readNotificationIds.has(`notif-missing-policy-${activeProjectId}`),
            link: "/uploads",
          },
        ]
      : []),
  ];

  const handleMarkAllNotificationsAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadNotificationIds(allIds);
    notifyToast({
      title: "All notifications marked as read",
      icon: "success",
    });
  };

  const selectProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, ...updates } : project
      )
    );

    try {
      await api.projects.update(projectId, updates);
    } catch {
      // Local optimistic state preserved
    }
  };

  const cloneProject = async (sourceProjectId: string, newPlatform?: Platform) => {
    const source = projects.find((p) => p.id === sourceProjectId);
    if (!source) return;

    const targetPlatform = newPlatform || (source.platform === "Android" ? "iOS" : "Android");

    try {
      const cloned = await api.projects.clone(sourceProjectId);
      if (cloned) {
        setProjects((current) => [cloned, ...current]);
        setActiveProjectId(cloned.id);
        notifyToast({
          title: `Cloned to ${cloned.platform} project`,
          icon: "success",
        });
        return;
      }
    } catch {
      // Offline fallback cloning
    }

    const clonedId = `proj-${Date.now().toString(36)}`;
    const clonedName = `${source.name} (${targetPlatform})`;
    const clonedPackage = targetPlatform === "iOS"
      ? `com.${source.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.ios`
      : `com.${source.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.clone`;

    const clonedProject: Project = {
      ...source,
      id: clonedId,
      name: clonedName,
      platform: targetPlatform,
      packageId: clonedPackage,
      status: "Needs review",
      readinessScore: 0,
    };

    setProjects((current) => [clonedProject, ...current]);
    setHistoryByProject((prev) => ({
      ...prev,
      [clonedId]: [
        {
          event: "Project Cloned",
          person: "Project Owner",
          time: "Just now",
          detail: `Cloned from ${source.name} targeting ${targetPlatform}.`,
        },
      ],
    }));

    setActiveProjectId(clonedId);
    notifyToast({
      title: `Cloned to ${targetPlatform} project`,
      icon: "success",
    });
  };

  const deleteProject = async (projectId: string) => {
    setProjects((current) => {
      const remaining = current.filter((p) => p.id !== projectId);
      if (remaining.length > 0 && activeProjectId === projectId) {
        setActiveProjectId(remaining[0].id);
      }
      return remaining;
    });

    try {
      await api.projects.delete(projectId);
    } catch {
      // Local deletion
    }

    notifyToast({
      title: "Project removed from workspace",
      icon: "error",
    });
  };

  const createProject = async (fields: NewProjectFields) => {
    const isCustomPolicy = fields.platform === "Custom Policy";
    const packageId = isCustomPolicy
      ? `policy.${fields.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.suite`
      : `com.${fields.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.app`;

    const formattedTarget = new Date(`${fields.releaseTarget}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    try {
      const liveNewProject = await api.projects.create({
        name: fields.name,
        platform: fields.platform,
        category: fields.category || (isCustomPolicy ? "Security & Governance" : "Health & Fitness"),
        description: fields.description,
        releaseTarget: formattedTarget,
        packageId,
        customPolicy: fields.customPolicy,
      });

      if (liveNewProject) {
        setProjects((current) => [liveNewProject, ...current]);
        setActiveProjectId(liveNewProject.id);
        setIsNewProjectOpen(false);

        // Initialize clean slate stores
        setManifestsByProject((prev) => ({ ...prev, [liveNewProject.id]: undefined }));
        setPrivacyPoliciesByProject((prev) => ({ ...prev, [liveNewProject.id]: undefined }));
        setTestCasesByProject((prev) => ({ ...prev, [liveNewProject.id]: [] }));
        setAssetsByProject((prev) => ({ ...prev, [liveNewProject.id]: [] }));
        setHistoryByProject((prev) => ({
          ...prev,
          [liveNewProject.id]: [
            {
              event: "Project Release Suite Initialized",
              person: "Project Owner",
              time: "Just now",
              detail: `Created ${fields.platform} release suite with package ID ${packageId}.`,
            },
          ],
        }));

        notifyToast({
          title: `Created project "${liveNewProject.name}" with clean audit slate`,
          icon: "success",
        });
        return;
      }
    } catch {
      // Local creation fallback
    }

    const localId = `proj-${Date.now().toString(36)}`;
    const localProject: Project = {
      id: localId,
      name: fields.name,
      platform: fields.platform,
      description: fields.description,
      releaseTarget: formattedTarget,
      packageId,
      version: "1.0.0",
      category: fields.category || (isCustomPolicy ? "Security & Governance" : "Health & Fitness"),
      releaseNotes: isCustomPolicy ? "Initial corporate compliance evaluation suite." : "Initial release candidate.",
      readinessScore: 0,
      status: "Needs review",
      customPolicy: fields.customPolicy,
    };

    const initialBaselineFindings: ComplianceFinding[] = [
      {
        id: "chk-manifest-missing",
        title: "AndroidManifest.xml Artifact Missing",
        status: "Blocked",
        severity: "High",
        owner: "Android Dev",
        detail: "No AndroidManifest.xml has been uploaded for permission and SDK level verification.",
        category: "Artifact Verification",
        guidelineRef: "Store Submission Readiness Standard §1.1",
        remediation: "Upload AndroidManifest.xml in the Uploads & Verification Center.",
      },
      {
        id: "chk-privacy-missing",
        title: "Privacy Policy Document Missing",
        status: "Blocked",
        severity: "High",
        owner: "Legal",
        detail: "No Privacy Policy document has been uploaded for clause evaluation.",
        category: "Data Safety",
        guidelineRef: "Play Console User Data Policy §4.8",
        remediation: "Upload Privacy Policy document or paste text in Uploads & Verification Center.",
      },
    ];

    setProjects((current) => [localProject, ...current]);
    setManifestsByProject((prev) => ({ ...prev, [localId]: undefined }));
    setPrivacyPoliciesByProject((prev) => ({ ...prev, [localId]: undefined }));
    setComplianceByProject((prev) => ({ ...prev, [localId]: initialBaselineFindings }));
    setTestCasesByProject((prev) => ({ ...prev, [localId]: [] }));
    setAssetsByProject((prev) => ({ ...prev, [localId]: [] }));
    setHistoryByProject((prev) => ({
      ...prev,
      [localId]: [
        {
          event: "Project Release Suite Initialized",
          person: "Project Owner",
          time: "Just now",
          detail: `Created ${fields.platform} release suite with package ID ${packageId}.`,
        },
      ],
    }));

    if (fields.customPolicy?.rules) {
      setCustomRulesByProject((current) => ({
        ...current,
        [localId]: fields.customPolicy?.rules || [],
      }));
    }

    setActiveProjectId(localId);
    setIsNewProjectOpen(false);
    notifyToast({
      title: `Created project "${localProject.name}" (0% score, clean slate)`,
      icon: "success",
    });
  };

  const saveAppDetails = async (details: Partial<Project>) => {
    await updateProject(activeProjectId, details);
  };

  const recalculateProjectScore = (findings: ComplianceFinding[], customRulesList: CustomPolicyRule[]) => {
    const isCustom = activeProject.platform === "Custom Policy";
    let blockedCount = 0;
    let passedCount = 0;
    let total = 0;

    if (isCustom) {
      total = customRulesList.length || 1;
      blockedCount = customRulesList.filter((r) => r.status === "Blocked").length;
      passedCount = customRulesList.filter((r) => r.status === "Passed").length;
    } else {
      total = findings.length || 1;
      blockedCount = findings.filter((f) => f.status === "Blocked").length;
      passedCount = findings.filter((f) => f.status === "Passed").length;
    }

    const calculatedScore = Math.round((passedCount / total) * 100);
    const newStatus: Project["status"] =
      blockedCount > 0 ? "Blocked" : calculatedScore >= 80 ? "Ready" : "Needs review";

    setProjects((current) =>
      current.map((p) =>
        p.id === activeProjectId
          ? { ...p, readinessScore: calculatedScore, status: newStatus }
          : p
      )
    );
  };

  const handleToggleComplianceStatus = async (checkId: string) => {
    const existing = complianceByProject[activeProjectId] ?? [];
    const targetCheck = existing.find((c) => c.id === checkId || c.title.toLowerCase() === checkId.toLowerCase());
    const nextStatus: RuleStatus = targetCheck?.status === "Passed" ? "Blocked" : "Passed";

    const updated: ComplianceFinding[] = existing.map((check) => {
      if (check.id === checkId || check.title.toLowerCase() === checkId.toLowerCase()) {
        return { ...check, status: nextStatus };
      }
      return check;
    });

    setComplianceByProject((current) => ({ ...current, [activeProjectId]: updated }));
    recalculateProjectScore(updated, activeCustomRules);

    notifyToast({
      title: `Compliance check marked as ${nextStatus}`,
      icon: nextStatus === "Passed" ? "success" : "warning",
    });

    if (targetCheck) {
      try {
        await api.compliance.updateStatus(activeProjectId, targetCheck.id, nextStatus);
      } catch {
        // Local state preserved
      }
    }
  };

  const handleToggleCustomRuleStatus = (ruleId: string) => {
    setCustomRulesByProject((current) => {
      const existing = current[activeProjectId] ?? activeProject.customPolicy?.rules ?? [];
      const updated: CustomPolicyRule[] = existing.map((rule) => {
        if (rule.id === ruleId) {
          const nextStatus: RuleStatus = rule.status === "Passed" ? "Blocked" : "Passed";
          return { ...rule, status: nextStatus };
        }
        return rule;
      });

      recalculateProjectScore(activeCompliance, updated);
      notifyToast({
        title: "Custom rule status updated",
        icon: "info",
      });
      return { ...current, [activeProjectId]: updated };
    });
  };

  const handleUploadManifest = async (manifest: ManifestArtifact) => {
    setManifestsByProject((current) => ({
      ...current,
      [activeProjectId]: manifest,
    }));

    // Dynamic client evaluation
    const evaluation = evaluateClientCompliance(activeProject, manifest, activePrivacyPolicy);
    setComplianceByProject((prev) => ({ ...prev, [activeProjectId]: evaluation.findings }));
    setProjects((current) =>
      current.map((p) =>
        p.id === activeProjectId
          ? { ...p, readinessScore: evaluation.readinessScore, status: evaluation.status }
          : p
      )
    );

    // Record audit history event
    const highRiskCount = manifest.permissions.filter((p) => p.risk === "High").length;
    setHistoryByProject((prev) => ({
      ...prev,
      [activeProjectId]: [
        {
          event: "AndroidManifest.xml Uploaded & Audited",
          person: "ReleaseIQ Engine",
          time: "Just now",
          detail: `Extracted ${manifest.permissions.length} permissions (${highRiskCount} high risk), Target SDK ${manifest.targetSdkVersion ?? 34}.`,
        },
        ...(prev[activeProjectId] ?? []),
      ],
    }));

    try {
      await api.artifacts.uploadManifest(activeProjectId, undefined, manifest.name);
    } catch {
      // Local state preserved
    }
  };

  const handleUploadPrivacyPolicy = async (policy: PrivacyPolicyArtifact) => {
    setPrivacyPoliciesByProject((current) => ({
      ...current,
      [activeProjectId]: policy,
    }));

    // Dynamic client evaluation
    const evaluation = evaluateClientCompliance(activeProject, activeManifest, policy);
    setComplianceByProject((prev) => ({ ...prev, [activeProjectId]: evaluation.findings }));
    setProjects((current) =>
      current.map((p) =>
        p.id === activeProjectId
          ? { ...p, readinessScore: evaluation.readinessScore, status: evaluation.status }
          : p
      )
    );

    // Record audit history event
    setHistoryByProject((prev) => ({
      ...prev,
      [activeProjectId]: [
        {
          event: "Privacy Policy Document Validated",
          person: "ReleaseIQ Engine",
          time: "Just now",
          detail: `Audited ${policy.clauses.length} privacy & data safety clauses against store guidelines.`,
        },
        ...(prev[activeProjectId] ?? []),
      ],
    }));

    try {
      await api.artifacts.uploadPrivacyPolicy(activeProjectId, undefined, policy.content || policy.fileName);
    } catch {
      // Local state preserved
    }
  };

  const handleToggleTestCaseStatus = async (testCaseId: string) => {
    const existing = testCasesByProject[activeProjectId] ?? [];
    let nextStatus: TestCase["status"] = "Ready";

    const updated = existing.map((tc) => {
      if (tc.id === testCaseId) {
        nextStatus =
          tc.status === "Ready"
            ? "Passed"
            : tc.status === "Passed"
              ? "Blocked"
              : "Ready";
        notifyToast({
          title: `Test ${tc.id} marked as ${nextStatus}`,
          icon: nextStatus === "Passed" ? "success" : nextStatus === "Blocked" ? "warning" : "info",
        });
        return { ...tc, status: nextStatus };
      }
      return tc;
    });

    setTestCasesByProject((current) => ({ ...current, [activeProjectId]: updated }));

    try {
      await api.testCases.update(activeProjectId, testCaseId, { status: nextStatus });
    } catch {
      // Local state updated
    }
  };

  const handleAddTestCase = async (newTestCase: TestCase) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? [];
      notifyToast({
        title: `Added test case "${newTestCase.title}"`,
        icon: "success",
      });
      return {
        ...current,
        [activeProjectId]: [newTestCase, ...existing],
      };
    });

    try {
      await api.testCases.create(activeProjectId, newTestCase);
    } catch {
      // Local state updated
    }
  };

  const handleUpdateTestCase = async (updatedTestCase: TestCase) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? [];
      notifyToast({
        title: `Updated test case "${updatedTestCase.title}"`,
        icon: "success",
      });
      return {
        ...current,
        [activeProjectId]: existing.map((tc) =>
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        ),
      };
    });

    try {
      await api.testCases.update(activeProjectId, updatedTestCase.id, updatedTestCase);
    } catch {
      // Local state updated
    }
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? [];
      notifyToast({
        title: "Test case removed from suite",
        icon: "info",
      });
      return {
        ...current,
        [activeProjectId]: existing.filter((tc) => tc.id !== testCaseId),
      };
    });

    try {
      await api.testCases.delete(activeProjectId, testCaseId);
    } catch {
      // Local state updated
    }
  };

  const handleAddCustomRule = (rule: CustomPolicyRule) => {
    setCustomRulesByProject((current) => {
      const updated: CustomPolicyRule[] = [rule, ...(current[activeProjectId] ?? [])];
      recalculateProjectScore(activeCompliance, updated);
      notifyToast({
        title: `Added custom rule "${rule.ruleName}"`,
        icon: "success",
      });
      return { ...current, [activeProjectId]: updated };
    });
  };

  const handleAddAsset = (asset: AssetItem) => {
    setAssetsByProject((current) => ({
      ...current,
      [activeProjectId]: [asset, ...(current[activeProjectId] ?? [])],
    }));
    notifyToast({
      title: `Asset "${asset.name}" queued for release`,
      icon: "success",
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssetsByProject((current) => ({
      ...current,
      [activeProjectId]: (current[activeProjectId] ?? []).filter((a) => a.id !== assetId),
    }));
    notifyToast({
      title: "Asset removed from release bundle",
      icon: "info",
    });
  };

  const handleAddHistoryItem = (item: HistoryItem) => {
    setHistoryByProject((current) => ({
      ...current,
      [activeProjectId]: [item, ...(current[activeProjectId] ?? [])],
    }));
  };

  const handleRunAiAudit = async (): Promise<AiAuditResult | null> => {
    try {
      const result = await api.ai.audit(activeProjectId);
      if (result) {
        setHistoryByProject((prev) => ({
          ...prev,
          [activeProjectId]: [
            {
              event: "AI Policy Audit Executed (Groq)",
              person: "ReleaseIQ AI Assistant",
              time: "Just now",
              detail: result.executiveSummary || "Completed deep semantic policy scan and restricted permissions audit.",
            },
            ...(prev[activeProjectId] ?? []),
          ],
        }));
        return result;
      }
    } catch {
      // Fallback local response
    }
    return null;
  };

  return (
    <ReleaseContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        selectProject,
        createProject,
        saveAppDetails,
        updateProject,
        cloneProject,
        deleteProject,
        manifestsByProject,
        privacyPoliciesByProject,
        complianceByProject,
        testCasesByProject,
        customRulesByProject,
        assetsByProject,
        historyByProject,
        activeManifest,
        activePrivacyPolicy,
        activeCompliance,
        activeTestCases,
        activeCustomRules,
        activeAssets,
        activeHistory,
        notifications,
        isNotificationsOpen,
        setIsNotificationsOpen,
        handleMarkAllNotificationsAsRead,
        openBlockersCount,
        handleUploadManifest,
        handleUploadPrivacyPolicy,
        handleToggleTestCaseStatus,
        handleAddTestCase,
        handleUpdateTestCase,
        handleDeleteTestCase,
        handleToggleComplianceStatus,
        handleToggleCustomRuleStatus,
        handleAddCustomRule,
        handleAddAsset,
        handleDeleteAsset,
        handleAddHistoryItem,
        handleRunAiAudit,
        isNewProjectOpen,
        setIsNewProjectOpen,
        isLoading,
      }}
    >
      {children}
    </ReleaseContext.Provider>
  );
}

export function useRelease() {
  const context = useContext(ReleaseContext);
  if (!context) {
    throw new Error("useRelease must be used within a ReleaseProvider");
  }
  return context;
}
