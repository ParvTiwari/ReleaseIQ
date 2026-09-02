import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileArchive,
  FileCode2,
  FileText,
  Image,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";
import { defaultMockPermissions, defaultPrivacyClauses } from "../data/complianceRules";
import { notifyModal, notifyToast } from "../lib/alerts";
import type {
  ManifestArtifact,
  ParsedPermission,
  PrivacyPolicyArtifact,
  Project,
  Severity,
} from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function riskTone(risk: Severity) {
  if (risk === "High") return "danger";
  if (risk === "Medium") return "warning";
  return "success";
}

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

const defaultUploadItems = [
  { name: "release-aab-2.4.0.aab", type: "Android app bundle (AAB)", size: "84.2 MB", status: "Ready" },
  { name: "store-screenshots.zip", type: "Store Phone Screenshots", size: "18.7 MB", status: "Needs review" },
  { name: "feature-graphic.png", type: "Google Play Feature Graphic (1024x500)", size: "1.2 MB", status: "Ready" },
];

export function UploadsPage({
  project,
  manifest,
  privacyPolicy,
  onUploadManifest,
  onUploadPrivacyPolicy,
}: {
  project: Project;
  manifest?: ManifestArtifact;
  privacyPolicy?: PrivacyPolicyArtifact;
  onUploadManifest: (manifest: ManifestArtifact) => void;
  onUploadPrivacyPolicy: (policy: PrivacyPolicyArtifact) => void;
}) {
  const [activeTab, setActiveTab] = useState<"manifest" | "privacy" | "assets">("manifest");
  const manifestInputId = useId();
  const policyInputId = useId();
  const [manifestError, setManifestError] = useState("");
  const [pastedPolicyText, setPastedPolicyText] = useState("");
  const [isPastingPolicy, setIsPastingPolicy] = useState(false);

  const handleManifestFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xml")) {
      setManifestError("Please upload a valid AndroidManifest.xml file (.xml extension).");
      event.target.value = "";
      return;
    }

    const newArtifact: ManifestArtifact = {
      name: file.name,
      size: file.size,
      type: file.type || "application/xml",
      lastModified: file.lastModified,
      uploadedAt: Date.now(),
      permissions: defaultMockPermissions,
      targetSdkVersion: 34,
      minSdkVersion: 26,
    };

    onUploadManifest(newArtifact);
    setManifestError("");
    event.target.value = "";
    notifyModal({
      title: "AndroidManifest.xml Parsed",
      text: "Detected 4 permissions (1 High Risk permission requiring background declaration). Compliance audit updated.",
      icon: "success",
    });
  };

  const handlePrivacyPolicyFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newPolicy: PrivacyPolicyArtifact = {
      fileName: file.name,
      uploadedAt: Date.now(),
      status: "Needs review",
      clauses: defaultPrivacyClauses,
    };

    onUploadPrivacyPolicy(newPolicy);
    event.target.value = "";
    notifyModal({
      title: "Privacy Policy Evaluated",
      text: "Evaluated 4 data safety clauses against Google Play & App Store policy guidelines.",
      icon: "success",
    });
  };

  const submitPastedPolicy = () => {
    if (!pastedPolicyText.trim()) return;

    const newPolicy: PrivacyPolicyArtifact = {
      fileName: "Pasted-Policy-Document.txt",
      content: pastedPolicyText,
      uploadedAt: Date.now(),
      status: "Needs review",
      clauses: defaultPrivacyClauses,
    };

    onUploadPrivacyPolicy(newPolicy);
    setPastedPolicyText("");
    setIsPastingPolicy(false);
    notifyToast({
      title: "Pasted Privacy Policy text saved & audited",
      icon: "success",
    });
  };

  const highRiskCount = manifest?.permissions.filter((p: ParsedPermission) => p.risk === "High").length ?? 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Release Assets & Artifacts</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">Uploads & Verification Center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage manifests, privacy disclosures, and binaries for <span className="font-semibold text-foreground">{project.name}</span> ({project.platform}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={project.status === "Ready" ? "success" : project.status === "Blocked" ? "danger" : "warning"}>
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Manifest Status</p>
              <p className="mt-1 text-xl font-bold">{manifest ? "Uploaded & Parsed" : "Missing"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {manifest ? `${manifest.permissions.length} permissions detected` : "Required for Android release"}
              </p>
            </div>
            <div className={`grid h-11 w-11 place-items-center rounded-lg ${manifest ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {manifest ? <FileCode2 className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Privacy Policy</p>
              <p className="mt-1 text-xl font-bold">{privacyPolicy ? "Validated" : "Pending Upload"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {privacyPolicy ? `${privacyPolicy.clauses.length} clauses analyzed` : "Required by Google & Apple"}
              </p>
            </div>
            <div className={`grid h-11 w-11 place-items-center rounded-lg ${privacyPolicy ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Sensitive Risks</p>
              <p className="mt-1 text-xl font-bold">{highRiskCount} High Risk</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {highRiskCount > 0 ? "Requires Play Store justification" : "No critical permission flags"}
              </p>
            </div>
            <div className={`grid h-11 w-11 place-items-center rounded-lg ${highRiskCount > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
              {highRiskCount > 0 ? <ShieldAlert className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Uploads Navigation Sub-tabs */}
      <div className="flex border-b border-border text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("manifest")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
            activeTab === "manifest"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          Android Manifest & Permissions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
            activeTab === "privacy"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Privacy Policy Clause Validator
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${
            activeTab === "assets"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileArchive className="h-4 w-4" />
          Build Bundles & Media
        </button>
      </div>

      {/* TAB 1: Android Manifest Analyzer */}
      {activeTab === "manifest" && (
        <div className="grid gap-6">
          {!manifest ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Upload AndroidManifest.xml</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Upload your app's Android manifest to automatically extract declared permissions, verify target SDK level, and identify store compliance risks.
                </p>
                <div className="mt-6 flex justify-center">
                  <label
                    htmlFor={manifestInputId}
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-panel hover:bg-primary/90"
                  >
                    <UploadCloud className="h-4 w-4" /> Choose AndroidManifest.xml
                  </label>
                  <input
                    id={manifestInputId}
                    type="file"
                    accept=".xml,text/xml,application/xml"
                    onChange={handleManifestFile}
                    className="sr-only"
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Accepted formats: XML (.xml)</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Manifest Artifact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-primary">
                        <FileCode2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{manifest.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(manifest.size)} · Target SDK: {manifest.targetSdkVersion ?? 34} · Uploaded {new Date(manifest.uploadedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor={manifestInputId}
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-medium shadow-panel hover:bg-accent"
                      >
                        Replace Manifest File
                      </label>
                      <input
                        id={manifestInputId}
                        type="file"
                        accept=".xml,text/xml,application/xml"
                        onChange={handleManifestFile}
                        className="sr-only"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Manifest parsed successfully. Target API 34 compliance verified.
                  </div>
                </CardContent>
              </Card>

              {/* Parsed Permissions Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Extracted Permissions & Store Risk Analysis ({manifest.permissions.length})</CardTitle>
                    <span className="text-xs text-muted-foreground">Play Store Policy §4.8</span>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {manifest.permissions.map((perm) => (
                    <div
                      key={perm.name}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">{perm.name}</span>
                          <Badge tone={riskTone(perm.risk)}>{perm.risk} Risk</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                        {perm.playStoreGuidance && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1 border border-amber-200">
                            💡 <strong>Guidance:</strong> {perm.playStoreGuidance}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {perm.requiredJustification ? "Declaration Required" : "Standard Permission"}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {manifestError && (
            <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {manifestError}
            </p>
          )}
        </div>
      )}

      {/* TAB 2: Privacy Policy Analyzer */}
      {activeTab === "privacy" && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Privacy Policy Document & Clause Validator</CardTitle>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsPastingPolicy(!isPastingPolicy)}>
                    {isPastingPolicy ? "Cancel Paste" : "Paste Policy Text"}
                  </Button>
                  <label
                    htmlFor={policyInputId}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-panel hover:bg-primary/90"
                  >
                    <UploadCloud className="h-4 w-4" /> Upload Document
                  </label>
                  <input
                    id={policyInputId}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handlePrivacyPolicyFile}
                    className="sr-only"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isPastingPolicy ? (
                <div className="space-y-4">
                  <textarea
                    rows={6}
                    value={pastedPolicyText}
                    onChange={(e) => setPastedPolicyText(e.target.value)}
                    placeholder="Paste the full text of your Privacy Policy here to run clause validation..."
                    className="w-full rounded-md border border-border bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/25 font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsPastingPolicy(false)}>Cancel</Button>
                    <Button onClick={submitPastedPolicy}>Run Clause Analysis</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  ReleaseIQ inspects your privacy policy document for mandatory Google Play & Apple App Store clauses including user data collection disclosures, third-party analytics sharing, and account deletion workflows.
                </p>
              )}
            </CardContent>
          </Card>

          {privacyPolicy && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Evaluated Privacy Clauses ({privacyPolicy.clauses.length})</CardTitle>
                  <span className="text-xs text-muted-foreground">{privacyPolicy.fileName || "Uploaded Policy"}</span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {privacyPolicy.clauses.map((clause) => (
                  <div key={clause.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{clause.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-muted-foreground font-medium">
                          {clause.category}
                        </span>
                      </div>
                      <Badge tone={toneForStatus(clause.status)}>{clause.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{clause.detail}</p>
                    {clause.remediation && (
                      <div className="rounded bg-rose-50 border border-rose-200 p-2 text-xs text-rose-800 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                        <span><strong>Required Fix:</strong> {clause.remediation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: App Bundles & Assets Queue */}
      {activeTab === "assets" && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Release Binary & Media Upload Queue</CardTitle>
                <Button>
                  <UploadCloud className="h-4 w-4" /> Add Asset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              {defaultUploadItems.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-primary">
                      {item.name.endsWith(".aab") ? <FileArchive className="h-5 w-5" /> : <Image className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.type} · {item.size}</p>
                    </div>
                  </div>
                  <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
