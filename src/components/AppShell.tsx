import {
  Bell,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  FileText,
  History,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
  User,
  UserCheck,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AppPage, UserRole } from "../types/release";
import { Button } from "./ui/Button";

const navItems: Array<{ label: string; icon: typeof LayoutDashboard; path: string; page: AppPage }> = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", page: "dashboard" },
  { label: "Projects", icon: FileText, path: "/projects", page: "projects" },
  { label: "App details", icon: FilePenLine, path: "/app-details", page: "app-details" },
  { label: "Uploads & Manifest", icon: UploadCloud, path: "/uploads", page: "uploads" },
  { label: "Compliance & Policy", icon: ShieldCheck, path: "/compliance", page: "compliance" },
  { label: "Test Cases", icon: ClipboardCheck, path: "/test-cases", page: "test-cases" },
  { label: "Copy Review", icon: MessageSquareText, path: "/copy-review", page: "copy-review" },
  { label: "Readiness Report", icon: FileCheck2, path: "/reports", page: "reports" },
  { label: "History", icon: History, path: "/history", page: "history" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Release Readiness Dashboard",
  "/": "Release Readiness Dashboard",
  "/projects": "Projects & Policy Suites",
  "/app-details": "App Details & Configuration",
  "/uploads": "Uploads & Manifest Analyzer",
  "/compliance": "Compliance & Custom Policy Engine",
  "/test-cases": "Generated QA Test Cases",
  "/copy-review": "Store Listing Copy Review",
  "/reports": "Release Readiness Audit Report",
  "/history": "Release History & Audit Timeline",
  "/profile": "User Profile & Access Roles",
};

export function AppShell({
  children,
  openBlockersCount = 0,
  onNewProject,
}: {
  children: ReactNode;
  openBlockersCount?: number;
  onNewProject: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, switchRole } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentTitle = pageTitles[location.pathname] ?? "Release Readiness Dashboard";

  const handleSignOut = () => {
    signOut();
    setIsProfileOpen(false);
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Left Sidebar */}
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
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition ${
                  isActive || (item.path === "/dashboard" && location.pathname === "/")
                    ? "bg-accent font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.page === "compliance" && openBlockersCount > 0 && (
                <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {openBlockersCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-border p-3">
          <Link
            to="/profile"
            className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent"
          >
            <Settings className="h-4 w-4" />
            Account settings
          </Link>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
              <h1 className="text-lg font-semibold sm:text-xl">{currentTitle}</h1>
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

              {/* User Profile Avatar Dropdown */}
              {user ? (
                <div className="relative ml-1">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 pr-2.5 transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                      {user.avatarInitials}
                    </div>
                    <div className="hidden text-left sm:block">
                      <p className="text-xs font-semibold leading-none text-foreground">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{user.role}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {/* Profile Menu Dropdown Modal */}
                  {isProfileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 space-y-3"
                      onMouseLeave={() => setIsProfileOpen(false)}
                    >
                      <div className="border-b border-border pb-2 px-1">
                        <p className="text-xs font-bold text-foreground">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {user.role}
                        </span>
                      </div>

                      {/* Quick Role Switcher */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                          Switch Active Persona
                        </p>
                        {(["Project Owner", "QA Reviewer", "Legal Auditor", "Mobile Engineer"] as const).map((r: UserRole) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              switchRole(r);
                              setIsProfileOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition ${
                              user.role === r ? "bg-accent font-semibold text-primary" : "text-muted-foreground hover:bg-accent/60"
                            }`}
                          >
                            <span>{r}</span>
                            {user.role === r && <Check className="h-3.5 w-3.5 text-primary" />}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-border pt-2 space-y-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent"
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Account & Settings</span>
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Link to="/signin">
                    <Button variant="secondary" className="text-xs h-8">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
