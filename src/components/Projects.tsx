import {
  Copy,
  FilePenLine,
  Globe,
  Monitor,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Platform, Project } from "../types/release";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
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
  onUpdateProject,
  onCloneProject,
  onDeleteProject,
  onNewProject,
}: {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
  onCloneProject?: (sourceProjectId: string, newPlatform?: Platform) => void;
  onDeleteProject?: (projectId: string) => void;
  onNewProject?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"All" | Platform>("All");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          (platform === "All" || project.platform === platform) &&
          `${project.name} ${project.packageId} ${project.platform}`.toLowerCase().includes(query.toLowerCase())
      ),
    [platform, projects, query]
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Release Suites</p>
          <h2 className="text-2xl font-bold text-foreground">Projects & Policy Suites</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your multi-platform app store releases and custom corporate compliance suites
          </p>
        </div>
        {onNewProject && (
          <Button onClick={onNewProject}>
            <Plus className="h-4 w-4 mr-1" /> Create New Project
          </Button>
        )}
      </div>

      <section>
        <div className="flex flex-col gap-3 sm:flex-row">
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
          <div
            key={project.id}
            className={`group rounded-xl border bg-card transition hover:shadow-md ${
              project.id === activeProjectId ? "border-primary ring-1 ring-primary/25 shadow-sm" : "border-border hover:border-primary/50"
            }`}
          >
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div
                  className="cursor-pointer space-y-0.5 flex-1"
                  onClick={() => onSelectProject(project.id)}
                >
                  <p className="font-bold text-foreground text-base group-hover:text-primary transition">
                    {project.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{project.packageId}</p>
                </div>
                <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
              </div>

              {/* Platform badge & version */}
              <div className="flex items-center justify-between text-xs">
                <PlatformBadge platform={project.platform} />
                <span className="text-muted-foreground font-mono">v{project.version}</span>
              </div>

              <p className="min-h-10 text-xs leading-5 text-muted-foreground line-clamp-2">
                {project.description}
              </p>

              {project.customPolicy && (
                <div className="rounded-md bg-accent/60 p-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span className="font-medium truncate max-w-[180px]">📜 {project.customPolicy.policyName}</span>
                  <span className="font-semibold text-primary">{project.customPolicy.rules.length} rules</span>
                </div>
              )}

              {/* Score & Target */}
              <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Target Submission</p>
                  <p className="mt-0.5 text-xs font-semibold">{project.releaseTarget}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Readiness</p>
                  <p className="mt-0.5 text-base font-bold text-foreground">{project.readinessScore}%</p>
                </div>
              </div>

              {/* Card Action Controls */}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Button
                  variant="secondary"
                  className="text-xs h-8 px-3"
                  onClick={() => onSelectProject(project.id)}
                >
                  Open Workspace
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
                    title="Edit Project Configuration"
                  >
                    <FilePenLine className="h-4 w-4" />
                  </button>

                  {onCloneProject && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloneProject(project.id);
                      }}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
                      title="Duplicate / Clone Project to new Platform"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}

                  {onDeleteProject && projects.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject(project);
                      }}
                      className="p-1.5 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Project Suite"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {filteredProjects.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No projects or custom policies match your search.
        </p>
      )}

      {/* Edit Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onSave={(id, updates) => {
            if (onUpdateProject) onUpdateProject(id, updates);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <DeleteProjectModal
          isOpen={!!deletingProject}
          onClose={() => setDeletingProject(null)}
          project={deletingProject}
          onConfirmDelete={(id) => {
            if (onDeleteProject) onDeleteProject(id);
          }}
        />
      )}
    </div>
  );
}
