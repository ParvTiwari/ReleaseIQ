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
import type {
  ComplianceFinding,
  CustomPolicyRule,
  ManifestArtifact,
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
  manifestsByProject: Record<string, ManifestArtifact>;
  privacyPoliciesByProject: Record<string, PrivacyPolicyArtifact>;
  complianceByProject: Record<string, ComplianceFinding[]>;
  testCasesByProject: Record<string, TestCase[]>;
  customRulesByProject: Record<string, CustomPolicyRule[]>;
  activeManifest?: ManifestArtifact;
  activePrivacyPolicy?: PrivacyPolicyArtifact;
  activeCompliance: ComplianceFinding[];
  activeTestCases: TestCase[];
  activeCustomRules: CustomPolicyRule[];
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
  isNewProjectOpen: boolean;
  setIsNewProjectOpen: (open: boolean) => void;
  isLoading: boolean;
}

const ReleaseContext = createContext<ReleaseContextType | undefined>(undefined);

export function ReleaseProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProjects[0].id);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Per-project state stores
  const [manifestsByProject, setManifestsByProject] = useState<Record<string, ManifestArtifact>>(initialManifests);
  const [privacyPoliciesByProject, setPrivacyPoliciesByProject] = useState<Record<string, PrivacyPolicyArtifact>>(initialPrivacyPolicies);
  const [complianceByProject, setComplianceByProject] = useState<Record<string, ComplianceFinding[]>>({
    "pulsefit-android": initialChecks,
  });
  const [testCasesByProject, setTestCasesByProject] = useState<Record<string, TestCase[]>>({
    "pulsefit-android": initialTestCases,
  });
  const [customRulesByProject, setCustomRulesByProject] = useState<Record<string, CustomPolicyRule[]>>({});

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
        // Retain initial mock projects if backend is offline
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch project-specific compliance, test cases, and artifacts when active project changes
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
        if (liveTests.status === "fulfilled" && liveTests.value.length > 0) {
          setTestCasesByProject((prev) => ({ ...prev, [activeProjectId]: liveTests.value }));
        }
        if (liveManifest.status === "fulfilled" && liveManifest.value) {
          setManifestsByProject((prev) => ({ ...prev, [activeProjectId]: liveManifest.value }));
        }
        if (livePolicy.status === "fulfilled" && livePolicy.value) {
          setPrivacyPoliciesByProject((prev) => ({ ...prev, [activeProjectId]: livePolicy.value }));
        }
      } catch {
        // Fallback to local memory stores
      }
    };

    fetchProjectDetails();
  }, [activeProjectId]);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? initialProjects[0];
  const activeManifest = manifestsByProject[activeProjectId] ?? initialManifests[activeProjectId];
  const activePrivacyPolicy = privacyPoliciesByProject[activeProjectId] ?? initialPrivacyPolicies[activeProjectId];
  const activeCompliance = complianceByProject[activeProjectId] ?? initialChecks;
  const activeTestCases = testCasesByProject[activeProjectId] ?? initialTestCases;
  const activeCustomRules = customRulesByProject[activeProjectId] ?? activeProject.customPolicy?.rules ?? [];

  const openBlockersCount = activeProject.platform === "Custom Policy"
    ? activeCustomRules.filter((r) => r.status === "Blocked").length
    : activeCompliance.filter((c) => c.status === "Blocked").length;

  const selectProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    // Optimistic local update
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, ...updates } : project
      )
    );

    try {
      await api.projects.update(projectId, updates);
    } catch {
      // Retain optimistic update
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
      readinessScore: 70,
    };

    setProjects((current) => [clonedProject, ...current]);
    if (testCasesByProject[sourceProjectId]) {
      setTestCasesByProject((current) => ({
        ...current,
        [clonedId]: testCasesByProject[sourceProjectId].map((tc) => ({
          ...tc,
          id: `tc-cloned-${Date.now().toString(36).slice(-3)}-${tc.id.slice(-3)}`,
          status: "Ready",
        })),
      }));
    }
    if (complianceByProject[sourceProjectId]) {
      setComplianceByProject((current) => ({
        ...current,
        [clonedId]: complianceByProject[sourceProjectId].map((c) => ({
          ...c,
          status: "Warning",
        })),
      }));
    }

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
      // Local deletion handled
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

    try {
      const liveNewProject = await api.projects.create({
        name: fields.name,
        platform: fields.platform,
        category: fields.category || (isCustomPolicy ? "Security & Governance" : "Health & Fitness"),
        description: fields.description,
        releaseTarget: new Date(`${fields.releaseTarget}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        packageId,
        customPolicy: fields.customPolicy,
      });

      if (liveNewProject) {
        setProjects((current) => [liveNewProject, ...current]);
        setActiveProjectId(liveNewProject.id);
        setIsNewProjectOpen(false);
        notifyToast({
          title: `Created new project "${liveNewProject.name}"`,
          icon: "success",
        });
        return;
      }
    } catch {
      // Offline fallback creation
    }

    const localProject: Project = {
      id: crypto.randomUUID(),
      name: fields.name,
      platform: fields.platform,
      description: fields.description,
      releaseTarget: new Date(`${fields.releaseTarget}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      packageId,
      version: "1.0.0",
      category: fields.category || (isCustomPolicy ? "Security & Governance" : "Productivity"),
      releaseNotes: isCustomPolicy ? "Initial corporate compliance evaluation suite." : "Initial release.",
      readinessScore: fields.customPolicy ? 78 : 65,
      status: "Needs review",
      customPolicy: fields.customPolicy,
    };

    setProjects((current) => [localProject, ...current]);
    if (fields.customPolicy?.rules) {
      setCustomRulesByProject((current) => ({
        ...current,
        [localProject.id]: fields.customPolicy?.rules || [],
      }));
    }
    setActiveProjectId(localProject.id);
    setIsNewProjectOpen(false);
    notifyToast({
      title: `Created new project "${localProject.name}"`,
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
    const existing = complianceByProject[activeProjectId] ?? initialChecks;
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
      title: "Compliance check status updated",
      icon: "info",
    });

    if (targetCheck) {
      try {
        await api.compliance.updateStatus(activeProjectId, targetCheck.id, nextStatus);
      } catch {
        // Local state already updated
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

    const hasLocationRisk = manifest.permissions.some(
      (p) => p.name.includes("LOCATION") && p.risk === "High"
    );

    setComplianceByProject((current) => {
      const existing = current[activeProjectId] ?? initialChecks;
      const updated: ComplianceFinding[] = existing.map((check) =>
        check.id === "chk-2" || check.title.toLowerCase().includes("location")
          ? { ...check, status: (hasLocationRisk ? "Blocked" : "Passed") as RuleStatus }
          : check
      );
      recalculateProjectScore(updated, activeCustomRules);
      return { ...current, [activeProjectId]: updated };
    });

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

    setComplianceByProject((current) => {
      const existing = current[activeProjectId] ?? initialChecks;
      const updated: ComplianceFinding[] = existing.map((check) =>
        check.id === "chk-1" || check.title.toLowerCase().includes("privacy")
          ? { ...check, status: "Passed" as RuleStatus }
          : check
      );
      recalculateProjectScore(updated, activeCustomRules);
      return { ...current, [activeProjectId]: updated };
    });

    try {
      await api.artifacts.uploadPrivacyPolicy(activeProjectId, undefined, policy.fileName);
    } catch {
      // Local state preserved
    }
  };

  const handleToggleTestCaseStatus = async (testCaseId: string) => {
    const existing = testCasesByProject[activeProjectId] ?? initialTestCases;
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
      const existing = current[activeProjectId] ?? initialTestCases;
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
      const existing = current[activeProjectId] ?? initialTestCases;
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
      const existing = current[activeProjectId] ?? initialTestCases;
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
        activeManifest,
        activePrivacyPolicy,
        activeCompliance,
        activeTestCases,
        activeCustomRules,
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
