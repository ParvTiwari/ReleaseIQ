import {
  Bell,
  ClipboardCheck,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  LockKeyhole,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./ui/Button";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FileText },
  { label: "Uploads", icon: UploadCloud },
  { label: "Compliance", icon: ShieldCheck },
  { label: "Test Cases", icon: ClipboardCheck },
  { label: "Reports", icon: Gauge },
  { label: "History", icon: History },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">ReleaseIQ</p>
            <p className="text-xs text-muted-foreground">Release readiness</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <a
              href="#"
              key={item.label}
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                item.active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-border p-3">
          <a href="#" className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent">
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
              <h1 className="text-lg font-semibold sm:text-xl">Release Readiness Dashboard</h1>
            </div>
            <div className="hidden min-w-0 max-w-md flex-1 items-center rounded-md border border-border bg-card px-3 py-2 md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search projects, findings, reports"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="h-9 w-9 px-0" title="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button>New project</Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
