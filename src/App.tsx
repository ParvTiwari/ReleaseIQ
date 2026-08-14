import { useState } from "react";
import { AppShell, type AppPage } from "./components/AppShell";
import { AppDetails } from "./components/AppDetails";
import { Dashboard } from "./components/Dashboard";
import { NewProjectModal } from "./components/NewProjectModal";
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
  const createProject = ({ name, platform, description, releaseTarget }: Pick<Project, "name" | "platform" | "description" | "releaseTarget">) => {
    const project: Project = { id: crypto.randomUUID(), name, platform, description, releaseTarget: new Date(`${releaseTarget}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), packageId: "Not configured", version: "1.0.0", category: "Productivity", releaseNotes: "Initial release.", readinessScore: 0, status: "Needs review" };
    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setPage("dashboard");
    setIsNewProjectOpen(false);
  };
  const saveAppDetails = (details: Pick<Project, "name" | "packageId" | "version" | "category" | "releaseNotes" | "platform">) => {
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
