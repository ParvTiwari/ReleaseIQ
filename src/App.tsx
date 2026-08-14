import { useState } from "react";
import { AppShell, type AppPage } from "./components/AppShell";
import { AppDetails } from "./components/AppDetails";
import { Dashboard } from "./components/Dashboard";
import { NewProjectModal, type NewProjectFields } from "./components/NewProjectModal";
import { Projects } from "./components/Projects";
import {
  CompliancePage,
  CopyReviewPage,
  HistoryPage,
  TestCasesPage,
  UploadsPage,
} from "./components/StaticReleasePages";
import { projects as initialProjects, type Project } from "./data/mockRelease";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [page, setPage] = useState<AppPage>("dashboard");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  const selectProject = (projectId: string) => { setActiveProjectId(projectId); setPage("dashboard"); };
  const createProject = (fields: NewProjectFields) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name: fields.name,
      platform: fields.platform,
      description: fields.description,
      releaseTarget: new Date(`${fields.releaseTarget}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      packageId: fields.platform === "Custom Policy" ? `policy.${fields.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.suite` : "Not configured",
      version: "1.0.0",
      category: fields.platform === "Custom Policy" ? "Security & Governance" : "Productivity",
      releaseNotes: fields.platform === "Custom Policy" ? "Initial custom policy evaluation suite." : "Initial release.",
      readinessScore: fields.customPolicy ? 80 : 0,
      status: "Needs review",
      customPolicy: fields.customPolicy,
    };
    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setPage("dashboard");
    setIsNewProjectOpen(false);
  };
  const saveAppDetails = (details: Partial<Project>) => {
    setProjects((current) => current.map((project) => project.id === activeProjectId ? { ...project, ...details } : project));
  };

  return (
    <>
      <AppShell currentPage={page} onNavigate={setPage} onNewProject={() => setIsNewProjectOpen(true)}>
        {page === "dashboard" ? (
          <Dashboard activeProject={activeProject} projects={projects} onSelectProject={selectProject} onViewProjects={() => setPage("projects")} />
        ) : page === "projects" ? (
          <Projects projects={projects} activeProjectId={activeProjectId} onSelectProject={selectProject} />
        ) : page === "app-details" ? (
          <AppDetails project={activeProject} onSave={saveAppDetails} />
        ) : page === "uploads" ? (
          <UploadsPage project={activeProject} />
        ) : page === "compliance" ? (
          <CompliancePage project={activeProject} />
        ) : page === "test-cases" ? (
          <TestCasesPage project={activeProject} />
        ) : page === "copy-review" ? (
          <CopyReviewPage project={activeProject} />
        ) : (
          <HistoryPage project={activeProject} />
        )}
      </AppShell>
      {isNewProjectOpen && <NewProjectModal onClose={() => setIsNewProjectOpen(false)} onCreate={createProject} />}
    </>
  );
}
