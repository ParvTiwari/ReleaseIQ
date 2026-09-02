import { useState } from "react";
import { AppDetails } from "./components/AppDetails";
import { AppShell, type AppPage } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { NewProjectModal, type NewProjectFields } from "./components/NewProjectModal";
import { Projects } from "./components/Projects";
import { ReportPage } from "./components/ReportPage";
import {
  CompliancePage,
  CopyReviewPage,
  HistoryPage,
  TestCasesPage,
} from "./components/StaticReleasePages";
import { UploadsPage } from "./components/UploadsPage";
import {
  checks as initialChecks,
  initialManifests,
  initialPrivacyPolicies,
  initialTestCases,
  projects as initialProjects,
} from "./data/mockRelease";
import type {
  ComplianceFinding,
  CustomPolicyRule,
  ManifestArtifact,
  PrivacyPolicyArtifact,
  Project,
  TestCase,
} from "./types/release";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [page, setPage] = useState<AppPage>("dashboard");
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
    setPage("dashboard");
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
    setPage("dashboard");
    setIsNewProjectOpen(false);
  };

  const saveAppDetails = (details: Partial<Project>) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId ? { ...project, ...details } : project
      )
    );
  };

  const handleUploadManifest = (manifest: ManifestArtifact) => {
    setManifestsByProject((current) => ({
      ...current,
      [activeProjectId]: manifest,
    }));

    // Cascading: update compliance check and readiness score
    const hasLocationRisk = manifest.permissions.some(
      (p) => p.name.includes("LOCATION") && p.risk === "High"
    );

    setComplianceByProject((current) => {
      const existing = current[activeProjectId] ?? initialChecks;
      return {
        ...current,
        [activeProjectId]: existing.map((check) =>
          check.id === "chk-2" || check.title.toLowerCase().includes("location")
            ? { ...check, status: hasLocationRisk ? "Blocked" : "Passed" }
            : check
        ),
      };
    });

    setProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              readinessScore: Math.min(95, project.readinessScore + 10),
              status: hasLocationRisk ? "Blocked" : "Ready",
            }
          : project
      )
    );
  };

  const handleUploadPrivacyPolicy = (policy: PrivacyPolicyArtifact) => {
    setPrivacyPoliciesByProject((current) => ({
      ...current,
      [activeProjectId]: policy,
    }));

    // Cascading: mark data safety as passed and raise score
    setComplianceByProject((current) => {
      const existing = current[activeProjectId] ?? initialChecks;
      return {
        ...current,
        [activeProjectId]: existing.map((check) =>
          check.id === "chk-1" || check.title.toLowerCase().includes("privacy")
            ? { ...check, status: "Passed" }
            : check
        ),
      };
    });

    setProjects((current) =>
      current.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              readinessScore: Math.min(100, project.readinessScore + 8),
            }
          : project
      )
    );
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

  const handleAddCustomRule = (rule: CustomPolicyRule) => {
    setCustomRulesByProject((current) => ({
      ...current,
      [activeProjectId]: [rule, ...(current[activeProjectId] ?? [])],
    }));
  };

  return (
    <>
      <AppShell
        currentPage={page}
        openBlockersCount={openBlockersCount}
        onNavigate={setPage}
        onNewProject={() => setIsNewProjectOpen(true)}
      >
        {page === "dashboard" ? (
          <Dashboard
            activeProject={activeProject}
            projects={projects}
            complianceFindings={activeCompliance}
            testCases={activeTestCases}
            onSelectProject={selectProject}
            onViewProjects={() => setPage("projects")}
            onNavigateToUploads={() => setPage("uploads")}
            onNavigateToTestCases={() => setPage("test-cases")}
            onNavigateToReport={() => setPage("reports")}
          />
        ) : page === "projects" ? (
          <Projects
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={selectProject}
          />
        ) : page === "app-details" ? (
          <AppDetails project={activeProject} onSave={saveAppDetails} />
        ) : page === "uploads" ? (
          <UploadsPage
            project={activeProject}
            manifest={activeManifest}
            privacyPolicy={activePrivacyPolicy}
            onUploadManifest={handleUploadManifest}
            onUploadPrivacyPolicy={handleUploadPrivacyPolicy}
          />
        ) : page === "compliance" ? (
          <CompliancePage
            project={activeProject}
            complianceFindings={activeCompliance}
            customRules={activeCustomRules}
            onAddCustomRule={handleAddCustomRule}
          />
        ) : page === "test-cases" ? (
          <TestCasesPage
            project={activeProject}
            testCases={activeTestCases}
            onToggleStatus={handleToggleTestCaseStatus}
          />
        ) : page === "copy-review" ? (
          <CopyReviewPage project={activeProject} />
        ) : page === "reports" ? (
          <ReportPage
            project={activeProject}
            manifest={activeManifest}
            privacyPolicy={activePrivacyPolicy}
            complianceFindings={activeCompliance}
            testCases={activeTestCases}
          />
        ) : (
          <HistoryPage project={activeProject} />
        )}
      </AppShell>
      {isNewProjectOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectOpen(false)}
          onCreate={createProject}
        />
      )}
    </>
  );
}
