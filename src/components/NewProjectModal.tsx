import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Project } from "../data/mockRelease";
import { Button } from "./ui/Button";

type NewProjectFields = Pick<Project, "name" | "platform" | "description" | "releaseTarget">;

export function NewProjectModal({ onClose, onCreate }: { onClose: () => void; onCreate: (project: NewProjectFields) => void }) {
  const [form, setForm] = useState<NewProjectFields>({ name: "", platform: "Android", description: "", releaseTarget: "" });
  const update = (field: keyof NewProjectFields, value: string) => setForm((current) => ({ ...current, [field]: value } as NewProjectFields));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onCreate(form); };

  return <div className="fixed inset-0 z-30 grid place-items-center bg-foreground/30 p-4" role="presentation" onMouseDown={onClose}>
    <form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl" aria-labelledby="new-project-title">
      <div className="flex items-start justify-between gap-4"><div><h2 id="new-project-title" className="text-lg font-semibold">Create a project</h2><p className="mt-1 text-sm text-muted-foreground">Start a new mobile release readiness review.</p></div><Button type="button" variant="ghost" className="h-8 w-8 px-0" onClick={onClose} title="Close"><X className="h-4 w-4" /></Button></div>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">Project name<input required value={form.name} onChange={(event) => update("name", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25" placeholder="e.g. PulseFit Android" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Platform<select value={form.platform} onChange={(event) => update("platform", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"><option>Android</option><option>iOS</option></select></label>
        <label className="grid gap-1.5 text-sm font-medium">Description<textarea required value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-24 rounded-md border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/25" placeholder="What is this release for?" /></label>
        <label className="grid gap-1.5 text-sm font-medium">Target submission<input required type="date" value={form.releaseTarget} onChange={(event) => update("releaseTarget", event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25" /></label>
      </div>
      <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Create project</Button></div>
    </form>
  </div>;
}
