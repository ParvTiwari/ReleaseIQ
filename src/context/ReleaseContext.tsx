import {
  createContext,
  useContext,
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
  createProject: (fields: NewProjectFields) => void;
  saveAppDetails: (details: Partial<Project>) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  cloneProject: (sourceProjectId: string, newPlatform?: Platform) => void;
  deleteProject: (projectId: string) => void;
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
  handleUploadManifest: (manifest: ManifestArtifact) => void;
  handleUploadPrivacyPolicy: (policy: PrivacyPolicyArtifact) => void;
  handleToggleTestCaseStatus: (testCaseId: string) => void;
  handleAddTestCase: (testCase: TestCase) => void;
  handleUpdateTestCase: (testCase: TestCase) => void;
  handleDeleteTestCase: (testCaseId: string) => void;
  handleToggleComplianceStatus: (checkId: string) => void;
  handleToggleCustomRuleStatus: (ruleId: string) => void;
  handleAddCustomRule: (rule: CustomPolicyRule) => void;
  isNewProjectOpen: boolean;
  setIsNewProjectOpen: (open: boolean) => void;
}

const ReleaseContext = createContext<ReleaseContextType | undefined>(undefined);

export function ReleaseProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

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

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const activeManifest = manifestsByProject[activeProjectId];
  const activePrivacyPolicy = privacyPoliciesByProject[activeProjectId];
  const activeCompliance = complianceByProject[activeProjectId] ?? initialChecks;
  const activeTestCases = testCasesByProject[activeProjectId] ?? initialTestCases;
  const activeCustomRules = customRulesByProject[activeProjectId] ?? activeProject.customPolicy?.rules ?? [];

  const openBlockersCount = activeProject.platform === "Custom Policy"
    ? activeCustomRules.filter((r) => r.status === "Blocked").length
    : activeCompliance.filter((c) => c.status === "Blocked").length;

  const selectProject = (projectId: string) => {
    setActiveProjectId(projectId);
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
  };

  const cloneProject = (sourceProjectId: string, newPlatform?: Platform) => {
    const source = projects.find((p) => p.id === sourceProjectId);
    if (!source) return;

    const targetPlatform = newPlatform || (source.platform === "Android" ? "iOS" : "Android");
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
  };

  const deleteProject = (projectId: string) => {
    setProjects((current) => {
      const remaining = current.filter((p) => p.id !== projectId);
      if (remaining.length > 0 && activeProjectId === projectId) {
        setActiveProjectId(remaining[0].id);
      }
      return remaining;
    });
  };

  const createProject = (fields: NewProjectFields) => {
    const isCustomPolicy = fields.platform === "Custom Policy";
    const project: Project = {
      id: crypto.randomUUID(),
      name: fields.name,
      platform: fields.platform,
      description: fields.description,
      releaseTarget: new Date(`${fields.releaseTarget}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      packageId: isCustomPolicy
        ? `policy.${fields.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.suite`
        : `com.${fields.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.app`,
      version: "1.0.0",
      category: isCustomPolicy ? "Security & Governance" : "Productivity",
      releaseNotes: isCustomPolicy ? "Initial corporate compliance evaluation suite." : "Initial release.",
      readinessScore: fields.customPolicy ? 78 : 65,
      status: "Needs review",
      customPolicy: fields.customPolicy,
    };

    setProjects((current) => [project, ...current]);
    if (fields.customPolicy?.rules) {
      setCustomRulesByProject((current) => ({
        ...current,
        [project.id]: fields.customPolicy?.rules || [],
      }));
    }
    setActiveProjectId(project.id);
    setIsNewProjectOpen(false);
  };

  const saveAppDetails = (details: Partial<Project>) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId ? { ...project, ...details } : project
      )
    );
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

  const handleToggleComplianceStatus = (checkId: string) => {
    setComplianceByProject((current) => {
      const existing = current[activeProjectId] ?? initialChecks;
      const updated: ComplianceFinding[] = existing.map((check) => {
        if (check.id === checkId || check.title.toLowerCase() === checkId.toLowerCase()) {
          const nextStatus: RuleStatus = check.status === "Passed" ? "Blocked" : "Passed";
          return { ...check, status: nextStatus };
        }
        return check;
      });

      recalculateProjectScore(updated, activeCustomRules);
      return { ...current, [activeProjectId]: updated };
    });
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
      return { ...current, [activeProjectId]: updated };
    });
  };

  const handleUploadManifest = (manifest: ManifestArtifact) => {
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
  };

  const handleUploadPrivacyPolicy = (policy: PrivacyPolicyArtifact) => {
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
  };

  const handleToggleTestCaseStatus = (testCaseId: string) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? initialTestCases;
      return {
        ...current,
        [activeProjectId]: existing.map((tc) => {
          if (tc.id === testCaseId) {
            const nextStatus: TestCase["status"] =
              tc.status === "Ready"
                ? "Passed"
                : tc.status === "Passed"
                  ? "Blocked"
                  : "Ready";
            return { ...tc, status: nextStatus };
          }
          return tc;
        }),
      };
    });
  };

  const handleAddTestCase = (newTestCase: TestCase) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? initialTestCases;
      return {
        ...current,
        [activeProjectId]: [newTestCase, ...existing],
      };
    });
  };

  const handleUpdateTestCase = (updatedTestCase: TestCase) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? initialTestCases;
      return {
        ...current,
        [activeProjectId]: existing.map((tc) =>
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        ),
      };
    });
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    setTestCasesByProject((current) => {
      const existing = current[activeProjectId] ?? initialTestCases;
      return {
        ...current,
        [activeProjectId]: existing.filter((tc) => tc.id !== testCaseId),
      };
    });
  };

  const handleAddCustomRule = (rule: CustomPolicyRule) => {
    setCustomRulesByProject((current) => {
      const updated: CustomPolicyRule[] = [rule, ...(current[activeProjectId] ?? [])];
      recalculateProjectScore(activeCompliance, updated);
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
