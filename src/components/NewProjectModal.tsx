import { FileText, ShieldCheck, UploadCloud, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, type FormEvent, type ChangeEvent } from "react";
import { customPolicyPresets, type CustomPolicy, type Platform, type Project } from "../data/mockRelease";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export type NewProjectFields = Pick<Project, "name" | "platform" | "description" | "releaseTarget"> & {
  customPolicy?: CustomPolicy;
};

const platforms: Array<{ label: Platform; iconName: string; desc: string }> = [
  { label: "Android", iconName: "Play Store", desc: "Google Play Store submission guidelines" },
  { label: "iOS", iconName: "App Store", desc: "Apple App Store & TestFlight guidelines" },
  { label: "Web & Extension", iconName: "Web Store", desc: "Chrome Web Store, PWA & Web platform" },
  { label: "Windows Desktop", iconName: "Windows Store", desc: "Microsoft Store & Windows desktop app guidelines" },
  { label: "macOS Desktop", iconName: "Mac App Store", desc: "Mac App Store & macOS binary distribution guidelines" },
  { label: "Amazon Appstore", iconName: "Amazon", desc: "Fire Tablet, Fire TV & Amazon Appstore" },
  { label: "Samsung Galaxy Store", iconName: "Galaxy", desc: "Samsung Galaxy Apps & Store policies" },
  { label: "Custom Policy", iconName: "Custom Engine", desc: "Upload custom rulebook & evaluate compliance" },
];


export function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (project: NewProjectFields) => void;
}) {
  const [form, setForm] = useState<NewProjectFields>({
    name: "",
    platform: "Android",
    description: "",
    releaseTarget: "",
  });

  const [selectedPresetId, setSelectedPresetId] = useState(customPolicyPresets[0].id);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activePreset = customPolicyPresets.find((p) => p.id === selectedPresetId) || customPolicyPresets[0];

  const update = (field: keyof NewProjectFields, value: any) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleFileUpload = (file: File) => {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedFile({
      name: file.name,
      size: `${fileSizeMB === "0.0" ? "< 0.1" : fileSizeMB} MB`,
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let finalCustomPolicy: CustomPolicy | undefined = undefined;

    if (form.platform === "Custom Policy") {
      finalCustomPolicy = {
        fileName: uploadedFile ? uploadedFile.name : `${activePreset.name.replace(/ /g, "-")}-Policy.pdf`,
        fileSize: uploadedFile ? uploadedFile.size : "1.2 MB",
        uploadDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        policyName: activePreset.name,
        presetId: activePreset.id,
        rules: activePreset.defaultRules,
      };
    }

    onCreate({
      ...form,
      customPolicy: finalCustomPolicy,
    });
  };

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-foreground/40 p-4 backdrop-blur-xs overflow-y-auto"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl transition-all"
        aria-labelledby="new-project-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 id="new-project-title" className="text-xl font-bold tracking-tight">
              Create a Project
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a target publishing platform or upload a custom policy document.
            </p>
          </div>
          <Button type="button" variant="ghost" className="h-8 w-8 px-0" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-1.5 text-sm font-medium">
            Project Name <span className="text-rose-500">*</span>
            <input
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="e.g. Enterprise Cloud Vault, PulseFit Android"
            />
          </label>

          <div className="grid gap-1.5 text-sm font-medium">
            <label htmlFor="platform-select">Publishing Platform / Site <span className="text-rose-500">*</span></label>
            <select
              id="platform-select"
              value={form.platform}
              onChange={(event) => update("platform", event.target.value as Platform)}
              className="h-11 rounded-md border border-border bg-background px-3 font-medium outline-none focus:ring-2 focus:ring-primary/25"
            >
              {platforms.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label} — {p.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Special UI when Custom Policy platform is selected */}
          {form.platform === "Custom Policy" && (
            <div className="rounded-lg border border-primary/30 bg-accent/40 p-4 grid gap-4 transition-all">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Custom Policy Engine Configuration</h3>
                <Badge tone="success" className="ml-auto">Active Policy Mode</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your organization's custom compliance document or select a security baseline. ReleaseIQ will parse the rules and run automated checks.
              </p>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition ${
                  isDragging ? "border-primary bg-primary/10" : "border-border bg-background/50 hover:border-primary/50"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.json,.yaml,.yml,.txt,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <UploadCloud className="h-7 w-7 text-primary mb-1" />
                {uploadedFile ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>{uploadedFile.name}</span>
                    <span className="text-xs text-muted-foreground">({uploadedFile.size})</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-1" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium">
                      Drag & drop your policy file here, or <span className="text-primary underline">browse</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Supports PDF, JSON, YAML, TXT, DOCX (Max 25MB)
                    </p>
                  </>
                )}
              </div>

              {/* Preset selector */}
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Or choose a Policy Preset Rulebook:</label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
                >
                  {customPolicyPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.rulesCount} baseline rules)
                    </option>
                  ))}
                </select>
              </div>

              {/* Extracted rules preview */}
              <div className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between text-xs font-medium mb-2">
                  <span className="text-muted-foreground">Policy Rules Preview ({activePreset.defaultRules.length} rules)</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Auto-parsed
                  </span>
                </div>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {activePreset.defaultRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium text-foreground truncate max-w-[320px]">{rule.ruleName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        rule.severity === "High" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {rule.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <label className="grid gap-1.5 text-sm font-medium">
            Description <span className="text-rose-500">*</span>
            <textarea
              required
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              className="min-h-20 rounded-md border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="What is this release or policy evaluation target for?"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Target Submission / Review Date <span className="text-rose-500">*</span>
            <input
              required
              type="date"
              value={form.releaseTarget}
              onChange={(event) => update("releaseTarget", event.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {form.platform === "Custom Policy" ? "Create Custom Policy Review" : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}

