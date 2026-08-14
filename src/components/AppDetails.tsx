import { useEffect, useState, type FormEvent } from "react";
import type { Project } from "../data/mockRelease";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

type AppDetailsFields = Pick<Project, "name" | "packageId" | "version" | "category" | "releaseNotes" | "platform">;

const categories = ["Business", "Education", "Entertainment", "Finance", "Food & Drink", "Games", "Health & Fitness", "Lifestyle", "Medical", "Productivity", "Shopping", "Social", "Travel", "Utilities"];

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
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Configure the metadata used by release checks and reports.</p>
        <p className="mt-2 text-sm font-medium">Editing: {project.name}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Application metadata</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">App name<span className="sr-only">(required)</span><input required value={form.name} onChange={(event) => update("name", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25" /></label>
              <label className="grid gap-1.5 text-sm font-medium">Platform<span className="sr-only">(required)</span><select required value={form.platform} onChange={(event) => update("platform", event.target.value as Project["platform"])} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"><option>Android</option><option>iOS</option></select></label>
              <label className="grid gap-1.5 text-sm font-medium">Package ID / bundle ID<span className="sr-only">(required)</span><input required value={form.packageId} onChange={(event) => update("packageId", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25" placeholder="com.example.app" /></label>
              <label className="grid gap-1.5 text-sm font-medium">Version<span className="sr-only">(required)</span><input required value={form.version} onChange={(event) => update("version", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25" placeholder="1.0.0" /></label>
              <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Category<span className="sr-only">(required)</span><select required value={form.category} onChange={(event) => update("category", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25">{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="grid gap-1.5 text-sm font-medium md:col-span-2">Release notes<span className="sr-only">(required)</span><textarea required value={form.releaseNotes} onChange={(event) => update("releaseNotes", event.target.value)} className="min-h-32 rounded-md border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/25" placeholder="Summarize this release's changes." /></label>
            </div>
            {error && <p role="alert" className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            {saved && <p role="status" className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">App details saved for {form.name}.</p>}
            <div className="mt-6 flex justify-end"><Button type="submit">Save app details</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
