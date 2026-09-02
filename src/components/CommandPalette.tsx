import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Command,
  FileCode2,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googlePlayComplianceRules, appleAppStoreComplianceRules } from "../data/complianceRules";
import type { Project } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export function CommandPalette({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
}: {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // 1. Matched Projects
  const matchedProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.platform.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.packageId.toLowerCase().includes(q)
  );

  // 2. Matched Store Rules Catalog
  const allMasterRules = [...googlePlayComplianceRules, ...appleAppStoreComplianceRules];
  const matchedRules = q
    ? allMasterRules.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.storeGuidelineRef.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  // 3. Matched Quick Navigation Links
  const navigationItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, category: "Navigation" },
    { label: "Uploads & AndroidManifest Analyzer", path: "/uploads", icon: UploadCloud, category: "Navigation" },
    { label: "Platform Compliance & Policy Engine", path: "/compliance", icon: ShieldCheck, category: "Navigation" },
    { label: "Generated QA Test Cases Suite", path: "/test-cases", icon: ClipboardCheck, category: "Navigation" },
    { label: "Store Listing Copy Review", path: "/copy-review", icon: FileText, category: "Navigation" },
    { label: "Release Readiness Audit Report", path: "/reports", icon: FileText, category: "Navigation" },
    { label: "User Profile & Access Roles", path: "/profile", icon: User, category: "Navigation" },
  ].filter((item) => !q || item.label.toLowerCase().includes(q));

  const handleSelectProjectAndClose = (projectId: string) => {
    onSelectProject(projectId);
    navigate("/dashboard");
    onClose();
  };

  const handleNavigateAndClose = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-foreground/40 p-4 pt-16 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95"
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3.5">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, store guidelines, rules, permissions, test cases..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground font-normal"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
          <Button type="button" variant="ghost" className="h-7 w-7 px-0 sm:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Results Body */}
        <div className="p-3 overflow-y-auto space-y-4">
          {/* Projects Group */}
          {matchedProjects.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Projects & Policy Suites ({matchedProjects.length})
              </p>
              <div className="space-y-0.5">
                {matchedProjects.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => handleSelectProjectAndClose(p.id)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                      p.id === activeProjectId
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded bg-accent text-primary">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.packageId} · {p.platform} · {p.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold">{p.readinessScore}%</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Store Rules Group */}
          {matchedRules.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Store Compliance Rulebook Catalog
              </p>
              <div className="space-y-1">
                {matchedRules.map((rule) => (
                  <button
                    type="button"
                    key={rule.id}
                    onClick={() => handleNavigateAndClose("/compliance")}
                    className="w-full flex items-start justify-between rounded-lg border border-border bg-background p-2.5 text-left text-xs hover:bg-accent hover:border-primary/40 transition"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{rule.title}</span>
                        <span className="text-[10px] text-primary font-mono font-medium">({rule.storeGuidelineRef})</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{rule.description}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                      rule.severity === "High" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {rule.severity}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions & Navigation */}
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Workspace Actions
            </p>
            <div className="grid sm:grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewProject();
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-primary font-semibold hover:bg-primary/10 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Project</span>
              </button>

              {navigationItems.map((item) => (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => handleNavigateAndClose(item.path)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition"
                >
                  <item.icon className="h-4 w-4" />
                  <span>Go to {item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Tip: Press <kbd className="font-mono bg-background border px-1 rounded">Ctrl+K</kbd> anywhere to open</span>
          <span>ReleaseIQ Spotlight Engine</span>
        </div>
      </div>
    </div>
  );
}
