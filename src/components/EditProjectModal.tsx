import { FilePenLine, Save, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Platform, Project } from "../types/release";
import { Button } from "./ui/Button";

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (projectId: string, updates: Partial<Project>) => void;
}) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("Android");
  const [packageId, setPackageId] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [category, setCategory] = useState("Productivity");
  const [releaseTarget, setReleaseTarget] = useState("");
  const [description, setDescription] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setPlatform(project.platform);
      setPackageId(project.packageId);
      setVersion(project.version);
      setCategory(project.category);
      setReleaseTarget(project.releaseTarget);
      setDescription(project.description);
      setReleaseNotes(project.releaseNotes);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(project.id, {
      name: name.trim(),
      platform,
      packageId: packageId.trim(),
      version: version.trim(),
      category: category.trim(),
      releaseTarget: releaseTarget.trim(),
      description: description.trim(),
      releaseNotes: releaseNotes.trim(),
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <FilePenLine className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Edit Project Configuration</h3>
              <p className="text-xs text-muted-foreground font-mono">{project.packageId}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" className="h-8 w-8 px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Project Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="Android">Android (Google Play)</option>
                <option value="iOS">iOS (App Store)</option>
                <option value="Web & Extension">Web & Web Extension</option>
                <option value="Windows Desktop">Windows Desktop</option>
                <option value="macOS Desktop">macOS Desktop</option>
                <option value="Amazon Appstore">Amazon Appstore</option>
                <option value="Samsung Galaxy Store">Samsung Galaxy Store</option>
                <option value="Custom Policy">Custom Policy Engine</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Package Identifier</label>
              <input
                required
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Version</label>
              <input
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Target Submission Date</label>
            <input
              value={releaseTarget}
              onChange={(e) => setReleaseTarget(e.target.value)}
              placeholder="e.g. Sep 18, 2026"
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Release Notes / What's New</label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
