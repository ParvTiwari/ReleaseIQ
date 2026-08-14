import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Project } from "../data/mockRelease";
import { Badge } from "./ui/Badge";
import { Card, CardContent } from "./ui/Card";

function toneForStatus(status: Project["status"]) {
  if (status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

export function Projects({
  projects,
  activeProjectId,
  onSelectProject,
}: {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"All" | Project["platform"]>("All");
  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          (platform === "All" || project.platform === platform) &&
          `${project.name} ${project.packageId}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [platform, projects, query],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Select a release project to review its readiness data.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex h-10 flex-1 items-center rounded-md border border-border bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="ml-2 w-full bg-transparent text-sm outline-none" placeholder="Search projects or package IDs" />
          </label>
          <select value={platform} onChange={(event) => setPlatform(event.target.value as "All" | Project["platform"])} className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25">
            <option>All</option>
            <option>Android</option>
            <option>iOS</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <button type="button" key={project.id} onClick={() => onSelectProject(project.id)} className="text-left focus:outline-none focus:ring-2 focus:ring-primary/25">
            <Card className={project.id === activeProjectId ? "border-primary ring-1 ring-primary/25" : "transition hover:-translate-y-0.5 hover:border-primary/50"}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{project.packageId}</p>
                  </div>
                  <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
                </div>
                <p className="mt-4 min-h-10 text-sm leading-5 text-muted-foreground">{project.description}</p>
                <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
                  <div><p className="text-xs text-muted-foreground">Target submission</p><p className="mt-1 text-sm font-medium">{project.releaseTarget}</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Readiness</p><p className="mt-1 text-xl font-semibold">{project.readinessScore}%</p></div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>
      {filteredProjects.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No projects match your search.</p>}
    </div>
  );
}
