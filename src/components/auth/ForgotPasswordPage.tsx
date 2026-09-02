import { LockKeyhole, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    await resetPassword(email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-panel mx-auto">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-xs text-muted-foreground">
            Enter your email to receive password recovery instructions
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Account Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-10 font-medium">
                  {isLoading ? "Sending Instructions..." : "Send Password Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-3 py-2">
                <div className="inline-grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-foreground">Reset Email Sent</h2>
                <p className="text-xs text-muted-foreground leading-5">
                  We've sent a password reset confirmation to <strong>{email}</strong>. Check your inbox and follow the link to set a new password.
                </p>
                <div className="pt-2">
                  <Button variant="secondary" onClick={() => setIsSubmitted(false)}>
                    Try another email
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4 text-center">
              <Link to="/signin" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
