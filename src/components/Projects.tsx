import { Search, ShieldCheck, Globe, Monitor, Smartphone, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import type { Platform, Project } from "../data/mockRelease";
import { Badge } from "./ui/Badge";
import { Card, CardContent } from "./ui/Card";

function toneForStatus(status: Project["status"]) {
  if (status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

function PlatformBadge({ platform }: { platform: Platform }) {
  let icon = <Smartphone className="h-3.5 w-3.5" />;
  let colorClass = "bg-accent text-accent-foreground";

  if (platform === "Custom Policy") {
    icon = <ShieldCheck className="h-3.5 w-3.5 text-primary" />;
    colorClass = "bg-primary/10 text-primary border border-primary/20";
  } else if (platform === "Web & Extension") {
    icon = <Globe className="h-3.5 w-3.5 text-sky-600" />;
  } else if (platform === "Windows Desktop" || platform === "macOS Desktop") {
    icon = <Monitor className="h-3.5 w-3.5 text-indigo-600" />;
  } else if (platform === "Amazon Appstore" || platform === "Samsung Galaxy Store") {
    icon = <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {icon}
      {platform}
    </span>
  );
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
  const [platform, setPlatform] = useState<"All" | Platform>("All");

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          (platform === "All" || project.platform === platform) &&
          `${project.name} ${project.packageId} ${project.platform}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [platform, projects, query],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section>
        <p className="text-sm text-muted-foreground">
          Select a release project or custom policy evaluation suite to review readiness.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex h-10 flex-1 items-center rounded-md border border-border bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search projects, package IDs, or platforms..."
            />
          </label>
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value as "All" | Platform)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/25"
          >
            <option value="All">All Publishing Sites & Policies</option>
            <option value="Android">Android (Google Play)</option>
            <option value="iOS">iOS (App Store)</option>
            <option value="Web & Extension">Web & Web Extension</option>
            <option value="Windows Desktop">Windows Desktop</option>
            <option value="macOS Desktop">macOS Desktop</option>
            <option value="Amazon Appstore">Amazon Appstore</option>
            <option value="Samsung Galaxy Store">Samsung Galaxy Store</option>
            <option value="Custom Policy">Custom Policy Engine</option>
          </select>
        </div>
      </section>


      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <button
            type="button"
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="text-left focus:outline-none focus:ring-2 focus:ring-primary/25 rounded-lg"
          >
            <Card className={project.id === activeProjectId ? "border-primary ring-1 ring-primary/25 shadow-md" : "transition hover:-translate-y-0.5 hover:border-primary/50"}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{project.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-mono">{project.packageId}</p>
                  </div>
                  <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
                </div>

                <div className="mt-3">
                  <PlatformBadge platform={project.platform} />
                </div>

                <p className="mt-3 min-h-10 text-sm leading-5 text-muted-foreground line-clamp-2">
                  {project.description}
                </p>

                {project.customPolicy && (
                  <div className="mt-3 rounded-md bg-accent/60 p-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span className="font-medium truncate max-w-[190px]">📜 {project.customPolicy.policyName}</span>
                    <span className="font-semibold text-primary">{project.customPolicy.rules.length} rules</span>
                  </div>
                )}

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Target submission</p>
                    <p className="mt-0.5 text-xs font-medium">{project.releaseTarget}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Readiness</p>
                    <p className="mt-0.5 text-lg font-semibold">{project.readinessScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>

      {filteredProjects.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No projects or custom policies match your search.
        </p>
      )}
    </div>
  );
}

