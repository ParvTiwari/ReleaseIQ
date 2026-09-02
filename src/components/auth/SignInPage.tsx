import { LockKeyhole, ShieldCheck, UserCheck, ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/release";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Project Owner");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    signIn(email, selectedRole);
    navigate("/dashboard");
  };

  const handleQuickSignIn = (role: UserRole, demoEmail: string, demoName: string) => {
    signIn(demoEmail, role, demoName);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-panel mx-auto">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to ReleaseIQ</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to access your release readiness audits and compliance reports
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Work Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">Password</label>
                  <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Access Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="Project Owner">Project Owner / Lead</option>
                  <option value="QA Reviewer">QA Reviewer & Test Engineer</option>
                  <option value="Legal Auditor">Legal & Privacy Auditor</option>
                  <option value="Mobile Engineer">Mobile Engineer</option>
                </select>
              </div>

              <Button type="submit" className="w-full h-10 mt-2 font-medium">
                Sign In to Workspace <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>

            {/* 1-Click Quick Demo Sign-in */}
            <div className="mt-6 border-t border-border pt-5 space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Demo 1-Click Persona Sign-In
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSignIn("Project Owner", "parv@releaseiq.io", "Parv Tiwari")}
                  className="rounded border border-border bg-accent/30 p-2 text-center text-xs hover:bg-accent hover:border-primary/40 transition"
                >
                  <p className="font-semibold text-[11px] text-foreground">Project Owner</p>
                  <p className="text-[10px] text-muted-foreground">Parv T.</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSignIn("QA Reviewer", "qa-lead@releaseiq.io", "Aisha Khan")}
                  className="rounded border border-border bg-accent/30 p-2 text-center text-xs hover:bg-accent hover:border-primary/40 transition"
                >
                  <p className="font-semibold text-[11px] text-foreground">QA Reviewer</p>
                  <p className="text-[10px] text-muted-foreground">Aisha K.</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSignIn("Legal Auditor", "legal@releaseiq.io", "Elena Rostova")}
                  className="rounded border border-border bg-accent/30 p-2 text-center text-xs hover:bg-accent hover:border-primary/40 transition"
                >
                  <p className="font-semibold text-[11px] text-foreground">Legal Auditor</p>
                  <p className="text-[10px] text-muted-foreground">Elena R.</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
