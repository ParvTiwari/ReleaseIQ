import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { NewProjectModal } from "./components/NewProjectModal";
import { Projects } from "./components/Projects";
import { projects as initialProjects, type Project } from "./data/mockRelease";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [page, setPage] = useState<"dashboard" | "projects">("dashboard");
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  const selectProject = (projectId: string) => { setActiveProjectId(projectId); setPage("dashboard"); };
  const createProject = ({ name, platform, description, releaseTarget }: Pick<Project, "name" | "platform" | "description" | "releaseTarget">) => {
    const project: Project = { id: crypto.randomUUID(), name, platform, description, releaseTarget: new Date(`${releaseTarget}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), packageId: "Not configured", readinessScore: 0, status: "Needs review" };
    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setPage("dashboard");
    setIsNewProjectOpen(false);
  };

  return (
    <>
      <AppShell currentPage={page} onNavigate={setPage} onNewProject={() => setIsNewProjectOpen(true)}>
        {page === "dashboard" ? <Dashboard activeProject={activeProject} projects={projects} onSelectProject={selectProject} onViewProjects={() => setPage("projects")} /> : <Projects projects={projects} activeProjectId={activeProjectId} onSelectProject={selectProject} />}
      </AppShell>
      {isNewProjectOpen && <NewProjectModal onClose={() => setIsNewProjectOpen(false)} onCreate={createProject} />}
    </>
  );
}
