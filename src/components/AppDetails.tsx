import { useEffect, useState, type FormEvent } from "react";
import { FileText, ShieldCheck, UploadCloud, CheckCircle2 } from "lucide-react";
import { customPolicyPresets, type Platform, type Project } from "../data/mockRelease";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";

type AppDetailsFields = Pick<Project, "name" | "packageId" | "version" | "category" | "releaseNotes" | "platform">;

const categories = [
  "Business",
  "Education",
  "Entertainment",
  "Finance",
  "Food & Drink",
  "Games",
  "Health & Fitness",
  "Lifestyle",
  "Medical",
  "Productivity",
  "Security & Governance",
  "Shopping",
  "Social",
  "Travel",
  "Utilities",
];

const platformOptions: Platform[] = [
  "Android",
  "iOS",
  "Web & Extension",
  "Windows Desktop",
  "macOS Desktop",
  "Amazon Appstore",
  "Samsung Galaxy Store",
  "Custom Policy",
];


function detailsFor(project: Project): AppDetailsFields {
  const { name, packageId, version, category, releaseNotes, platform } = project;
  return { name, packageId, version, category, releaseNotes, platform };
}

export function AppDetails({ project, onSave }: { project: Project; onSave: (details: AppDetailsFields) => void }) {
  const [form, setForm] = useState<AppDetailsFields>(() => detailsFor(project));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(detailsFor(project));
    setError("");
    setSaved(false);
  }, [project]);

  const update = <Field extends keyof AppDetailsFields>(field: Field, value: AppDetailsFields[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasMissingRequiredField = Object.values(form).some((value) => !value.trim());
    if (hasMissingRequiredField) {
      setError("Complete all required app details before saving.");
      return;
    }
    onSave(form);
    setError("");
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Configure metadata and platform guidelines used by release checks.</p>
        <p className="mt-1 text-sm font-medium">Editing: {project.name}</p>
      </div>

      {/* Custom Policy Card if applicable */}
      {(project.customPolicy || form.platform === "Custom Policy") && (
        <Card className="border-primary/40 bg-accent/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>Custom Policy File & Rulebook</CardTitle>
              </div>
              <Badge tone="success">Active Policy</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border bg-card p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {project.customPolicy?.fileName || "Corp-Security-Policy.pdf"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.customPolicy?.fileSize || "1.4 MB"} · Uploaded {project.customPolicy?.uploadDate || "Recently"}
                  </p>
                </div>
              </div>
              <Button variant="secondary" className="text-xs shrink-0">
                <UploadCloud className="h-4 w-4 mr-1.5" /> Re-upload Policy File
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-muted-foreground font-medium">Active Policy Rulebook</p>
                <p className="mt-1 font-semibold text-foreground text-sm">
                  {project.customPolicy?.policyName || customPolicyPresets[0].name}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-muted-foreground font-medium">Evaluated Rules</p>
                <p className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {project.customPolicy?.rules.length || 6} Custom Rules Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Application & Platform Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                App Name
                <input
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Publishing Platform / Store
                <select
                  required
                  value={form.platform}
                  onChange={(event) => update("platform", event.target.value as Platform)}
                  className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                >
                  {platformOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Package ID / Bundle Identifier
                <input
                  required
                  value={form.packageId}
                  onChange={(event) => update("packageId", event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="com.example.app"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Version Code
                <input
                  required
                  value={form.version}
                  onChange={(event) => update("version", event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="1.0.0"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
                Category
                <select
                  required
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                  className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
                Release Notes / Evaluation Scope
                <textarea
                  required
                  value={form.releaseNotes}
                  onChange={(event) => update("releaseNotes", event.target.value)}
                  className="min-h-28 rounded-md border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Summarize this release's changes or custom review scope."
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            {saved && (
              <p role="status" className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                App details saved for {form.name}.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <Button type="submit">Save app details</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

