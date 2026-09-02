import {
  Bell,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  FileText,
  History,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppPage } from "../types/release";
import { Button } from "./ui/Button";

export type { AppPage };

const navItems: Array<{ label: string; icon: typeof LayoutDashboard; page: AppPage }> = [
  { label: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
  { label: "Projects", icon: FileText, page: "projects" },
  { label: "App details", icon: FilePenLine, page: "app-details" },
  { label: "Uploads & Manifest", icon: UploadCloud, page: "uploads" },
  { label: "Compliance & Policy", icon: ShieldCheck, page: "compliance" },
  { label: "Test Cases", icon: ClipboardCheck, page: "test-cases" },
  { label: "Copy Review", icon: MessageSquareText, page: "copy-review" },
  { label: "Readiness Report", icon: FileCheck2, page: "reports" },
  { label: "History", icon: History, page: "history" },
];

const pageTitles: Record<AppPage, string> = {
  dashboard: "Release Readiness Dashboard",
  projects: "Projects & Policy Suites",
  "app-details": "App Details & Configuration",
  uploads: "Uploads & Manifest Analyzer",
  compliance: "Compliance & Custom Policy Engine",
  "test-cases": "Generated QA Test Cases",
  "copy-review": "Store Listing Copy Review",
  reports: "Release Readiness Audit Report",
  history: "Release History & Audit Timeline",
};

export function AppShell({
  children,
  currentPage,
  openBlockersCount = 0,
  onNavigate,
  onNewProject,
}: {
  children: ReactNode;
  currentPage: AppPage;
  openBlockersCount?: number;
  onNavigate: (page: AppPage) => void;
  onNewProject: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">ReleaseIQ</p>
            <p className="text-xs text-muted-foreground">Release readiness platform</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => onNavigate(item.page)}
              className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                item.page === currentPage
                  ? "bg-accent font-medium text-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.page === "compliance" && openBlockersCount > 0 && (
                <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {openBlockersCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-border p-3">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent"
          >
            <Settings className="h-4 w-4" />
            Account settings
          </a>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
              <h1 className="text-lg font-semibold sm:text-xl">{pageTitles[currentPage]}</h1>
            </div>
            <div className="hidden min-w-0 max-w-md flex-1 items-center rounded-md border border-border bg-card px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search projects, findings, reports..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="relative h-9 w-9 px-0"
                title={openBlockersCount > 0 ? `${openBlockersCount} Open Release Blockers` : "Notifications"}
              >
                <Bell className="h-4 w-4" />
                {openBlockersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                    {openBlockersCount}
                  </span>
                )}
              </Button>
              <Button onClick={onNewProject}>New project</Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
