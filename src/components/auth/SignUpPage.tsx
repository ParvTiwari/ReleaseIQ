import { LockKeyhole, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/release";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<UserRole>("Project Owner");
  const [agreed, setAgreed] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !agreed) return;
    signUp(name, email, role, organization || "ReleaseIQ Technologies");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-panel mx-auto">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your ReleaseIQ Account</h1>
          <p className="text-xs text-muted-foreground">
            Join engineering teams automating app store release compliance & QA verification
          </p>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Parv Tiwari"
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

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
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Company / Team Name</label>
                  <input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. PulseFit Labs"
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Primary Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="Project Owner">Project Owner / Product Lead</option>
                    <option value="QA Reviewer">QA Engineer / Reviewer</option>
                    <option value="Legal Auditor">Legal & Privacy Auditor</option>
                    <option value="Mobile Engineer">Mobile Engineer (Android/iOS)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Create Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <span>
                  I agree to the ReleaseIQ Terms of Service and Privacy Policy for release auditing.
                </span>
              </label>

              <Button type="submit" disabled={!agreed} className="w-full h-10 mt-2 font-medium">
                Create Account & Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
