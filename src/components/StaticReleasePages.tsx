import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  FileArchive,
  FileCheck2,
  FileText,
  Image,
  Info,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import type { Project } from "../data/mockRelease";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";


const uploadItems = [
  { name: "release-aab-2.4.0.aab", type: "Android app bundle", size: "84.2 MB", status: "Ready" },
  { name: "store-screenshots.zip", type: "Phone screenshots", size: "18.7 MB", status: "Needs review" },
  { name: "privacy-disclosures.pdf", type: "Policy document", size: "420 KB", status: "Ready" },
];

const complianceItems = [
  { title: "Data safety disclosures", owner: "Legal", status: "Needs review", detail: "Analytics sharing needs final wording." },
  { title: "Sensitive permission declaration", owner: "Android", status: "Blocked", detail: "Background location requires a clearer use case." },
  { title: "Age rating questionnaire", owner: "Product", status: "Ready", detail: "Current answers match store category." },
  { title: "Privacy policy URL", owner: "Legal", status: "Ready", detail: "Live URL detected and reachable." },
];

const generatedTestCases = [
  { title: "Install clean release build on Android 15", priority: "High", area: "Smoke", status: "Ready" },
  { title: "Deny camera permission during avatar upload", priority: "Medium", area: "Permissions", status: "Ready" },
  { title: "Start workout with background location disabled", priority: "High", area: "Location", status: "Needs review" },
  { title: "Verify release build hides debug endpoints", priority: "High", area: "Security", status: "Ready" },
];

const copyFindings = [
  { field: "Short description", status: "Ready", note: "Clear value proposition under store limit." },
  { field: "Full description", status: "Needs review", note: "Claims about personalized coaching need evidence." },
  { field: "Release notes", status: "Ready", note: "Scannable and version-specific." },
  { field: "Permission rationale", status: "Blocked", note: "Background location wording is too broad." },
];

const historyItems = [
  { event: "UI screens updated", person: "Parth Gupta", time: "Today", detail: "Added static release workspace pages." },
  { event: "Readiness scan completed", person: "ReleaseIQ", time: "Aug 13, 2026", detail: "Found 2 blockers and 3 warnings." },
  { event: "Screenshots uploaded", person: "QA Team", time: "Aug 12, 2026", detail: "Added five phone screenshots." },
];

function toneForStatus(status: string) {
  if (status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

function PageIntro({ project, eyebrow, title }: { project: Project; eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Static workspace view for {project.name} and its {project.platform} release package.
        </p>
      </div>
      <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UploadCloud }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-md bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UploadsPage({ project }: { project: Project }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro project={project} eyebrow="Assets" title="Release uploads" />
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Uploaded files" value="3" icon={FileArchive} />
        <Metric label="Pending review" value="1" icon={Clock3} />
        <Metric label="Required assets" value="8/10" icon={Image} />
      </section>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Upload queue</CardTitle>
            <Button><UploadCloud className="h-4 w-4" /> Upload file</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {uploadItems.map((item) => (
            <div key={item.name} className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.type} · {item.size}</p>
              </div>
              <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CompliancePage({ project }: { project: Project }) {
  const isCustomPolicy = project.platform === "Custom Policy" || !!project.customPolicy;
  const customPolicy = project.customPolicy;

  const [ruleFilter, setRuleFilter] = useState<"All" | "Passed" | "Warning" | "Blocked">("All");
  const [customRules, setCustomRules] = useState(() => customPolicy?.rules || []);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRule, setNewRule] = useState({
    ruleName: "",
    category: "Security",
    severity: "High" as const,
    description: "",
  });

  const activeRules = isCustomPolicy ? (customRules.length ? customRules : customPolicy?.rules || []) : [];

  const filteredCustomRules = activeRules.filter(
    (rule) => ruleFilter === "All" || rule.status === ruleFilter
  );

  const passedCount = activeRules.filter((r) => r.status === "Passed").length;
  const warningCount = activeRules.filter((r) => r.status === "Warning").length;
  const blockedCount = activeRules.filter((r) => r.status === "Blocked").length;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.ruleName.trim()) return;

    const createdRule = {
      id: `custom-${Date.now()}`,
      ruleName: newRule.ruleName,
      category: newRule.category,
      severity: newRule.severity,
      description: newRule.description || "User-defined policy rule constraint.",
      status: "Passed" as const,
    };

    setCustomRules((prev) => [createdRule, ...prev]);
    setNewRule({ ruleName: "", category: "Security", severity: "High", description: "" });
    setIsAddingRule(false);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro
        project={project}
        eyebrow={isCustomPolicy ? "Self-Hosted & Corporate Policy" : "Store review"}
        title={isCustomPolicy ? "Custom Policy Evaluation Rules" : "Compliance checklist"}
      />

      {isCustomPolicy && customPolicy && (
        <Card className="border-primary/40 bg-accent/20">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Uploaded Custom Policy</p>
                <h3 className="text-base font-bold text-foreground">{customPolicy.policyName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  File: {customPolicy.fileName} ({customPolicy.fileSize}) · Uploaded: {customPolicy.uploadDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setIsAddingRule(true)}>
                + Add Custom Rule Check
              </Button>
              <Button>
                <UploadCloud className="h-4 w-4 mr-1.5" /> Re-scan Policy File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          label={isCustomPolicy ? "Passed Policy Rules" : "Passed checks"}
          value={isCustomPolicy ? `${passedCount}` : "2"}
          icon={ShieldCheck}
        />
        <Metric
          label={isCustomPolicy ? "Policy Warnings" : "Warnings"}
          value={isCustomPolicy ? `${warningCount}` : "1"}
          icon={AlertTriangle}
        />
        <Metric
          label={isCustomPolicy ? "Blocking Violations" : "Blockers"}
          value={isCustomPolicy ? `${blockedCount}` : "1"}
          icon={ShieldAlert}
        />
      </section>

      {/* Add Custom Rule Form Modal/Drawer */}
      {isAddingRule && (
        <Card className="border-primary ring-1 ring-primary/25">
          <CardHeader>
            <CardTitle>Add Custom Policy Rule Check</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRule} className="grid gap-4">
              <div className="grid md:grid-cols-3 gap-4">
                <label className="grid gap-1.5 text-sm font-medium">
                  Rule Name / Identifier
                  <input
                    required
                    value={newRule.ruleName}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, ruleName: e.target.value }))}
                    className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="e.g. Disallow unencrypted S3 bucket calls"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Category
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, category: e.target.value }))}
                    className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option>Security</option>
                    <option>Data Protection</option>
                    <option>Privacy</option>
                    <option>Compliance</option>
                    <option>Quality</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Severity Level
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, severity: e.target.value as any }))}
                    className="h-10 rounded-md border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-medium">
                Rule Description & Constraint Rationale
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-20 rounded-md border border-border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Describe the exact check criteria to evaluate against project assets..."
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsAddingRule(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save & Evaluate Rule</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rules listing */}
      {isCustomPolicy ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Evaluated Custom Policy Rules ({filteredCustomRules.length})</CardTitle>
              <div className="flex gap-1 bg-muted p-1 rounded-md text-xs">
                {(["All", "Passed", "Warning", "Blocked"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRuleFilter(filter)}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      ruleFilter === filter ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {filteredCustomRules.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{rule.ruleName}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      rule.severity === "High" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {rule.severity} Severity
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  <p className="text-xs text-muted-foreground pt-1">Category: <span className="font-medium text-foreground">{rule.category}</span></p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <Badge tone={toneForStatus(rule.status)}>{rule.status}</Badge>
                  <Button variant="ghost" className="text-xs">Inspect</Button>
                </div>
              </div>
            ))}
            {filteredCustomRules.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No policy rules match the selected filter.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {complianceItems.map((item) => (
            <Card key={item.title}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Owner: {item.owner}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}


export function TestCasesPage({ project }: { project: Project }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro project={project} eyebrow="Quality" title="Generated test cases" />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Release validation suite</CardTitle>
            <Button variant="secondary"><Download className="h-4 w-4" /> Export</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {generatedTestCases.map((testCase) => (
            <div key={testCase.title} className="grid gap-3 rounded-md border border-border p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <div>
                <p className="font-medium">{testCase.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{testCase.area}</p>
              </div>
              <Badge tone={testCase.priority === "High" ? "danger" : "neutral"}>{testCase.priority}</Badge>
              <Badge tone={toneForStatus(testCase.status)}>{testCase.status}</Badge>
              <Button variant="ghost">Open</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CopyReviewPage({ project }: { project: Project }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro project={project} eyebrow="Store listing" title="Copy review" />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Review findings</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {copyFindings.map((finding) => (
              <div key={finding.field} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{finding.field}</p>
                  <Badge tone={toneForStatus(finding.status)}>{finding.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Listing preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-primary text-primary-foreground">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-muted-foreground">{project.category}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6">{project.releaseNotes}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function HistoryPage({ project }: { project: Project }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro project={project} eyebrow="Timeline" title="Release history" />
      <Card>
        <CardContent className="grid gap-4">
          {historyItems.map((item) => (
            <div key={`${item.event}-${item.time}`} className="grid gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:items-start">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-primary">
                {item.person === "ReleaseIQ" ? <FileCheck2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium">{item.event}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.person}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        This is a static UI timeline. Activity storage can be connected later.
      </div>
    </div>
  );
}
