import {
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/release";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

export function ProfilePage() {
  const { user, updateProfile, switchRole } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [role, setRole] = useState<UserRole>(user?.role || "Project Owner");
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-4">
        <h2 className="text-xl font-bold">You are currently in Guest Mode</h2>
        <p className="text-sm text-muted-foreground">Sign in to manage your user profile and security preferences.</p>
      </div>
    );
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      organization,
      role,
      twoFactorEnabled: twoFactor,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account & Security</p>
          <h2 className="text-2xl font-bold text-foreground">User Profile Settings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your personal credentials, access roles, and notification preferences</p>
        </div>
        <Badge tone="success">{user.role}</Badge>
      </div>

      {savedSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Profile and role preferences updated successfully.</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Main Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details & Persona</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-sm">
                  {user.avatarInitials}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">{user.name}</h3>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Member since {user.joinedDate}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Organization</label>
                  <input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Workspace Role</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newR = e.target.value as UserRole;
                      setRole(newR);
                      switchRole(newR);
                    }}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="Project Owner">Project Owner / Lead</option>
                    <option value="QA Reviewer">QA Reviewer & Test Engineer</option>
                    <option value="Legal Auditor">Legal & Privacy Auditor</option>
                    <option value="Mobile Engineer">Mobile Engineer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-1.5" /> Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security & Access Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Auth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Two-Factor Authentication (2FA)</p>
                  <p className="text-[11px] text-muted-foreground">Enforces authenticator app verification on sign-in</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    twoFactor ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      twoFactor ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground">API Token (CI/CD Automated Audits)</p>
                <div className="rounded bg-accent p-2.5 font-mono text-[11px] text-muted-foreground flex items-center justify-between border border-border">
                  <span>rq_live_98ab44f...39c</span>
                  <Button variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => alert("API Token copied to clipboard!")}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="pt-1">
                <Button variant="secondary" className="w-full text-xs">
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Manage manifest uploads & Play Store analyses</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Approve compliance exemptions & QA test runs</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Export official release readiness audit PDF</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
