import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Info,
  ListChecks,
  MessageSquareText,
  Play,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { copyFindings as defaultCopyFindings, historyItems as defaultHistoryItems } from "../data/mockRelease";
import type {
  ComplianceFinding,
  CustomPolicyRule,
  HistoryItem,
  Project,
  TestCase,
} from "../types/release";
import { NewTestCaseModal } from "./NewTestCaseModal";
import { RuleInspectorModal } from "./RuleInspectorModal";
import { TestCaseExecutionModal } from "./TestCaseExecutionModal";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

function PageIntro({ project, eyebrow, title }: { project: Project; eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Workspace review for <span className="font-semibold text-foreground">{project.name}</span> ({project.platform} release target: {project.releaseTarget}).
        </p>
      </div>
      <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UploadCloud }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CompliancePage({
  project,
  complianceFindings = [],
  customRules = [],
  onAddCustomRule,
  onToggleStatus,
}: {
  project: Project;
  complianceFindings?: ComplianceFinding[];
  customRules?: CustomPolicyRule[];
  onAddCustomRule?: (rule: CustomPolicyRule) => void;
  onToggleStatus?: (id: string) => void;
}) {
  const isCustomPolicy = project.platform === "Custom Policy" || !!project.customPolicy;
  const customPolicy = project.customPolicy;

  const [ruleFilter, setRuleFilter] = useState<"All" | "Passed" | "Warning" | "Blocked">("All");
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<ComplianceFinding | CustomPolicyRule | null>(null);

  const [newRule, setNewRule] = useState({
    ruleName: "",
    category: "Security",
    severity: "High" as const,
    description: "",
  });

  const activeRules: CustomPolicyRule[] = customRules.length
    ? customRules
    : customPolicy?.rules || [];

  const filteredCustomRules = activeRules.filter(
    (rule) => ruleFilter === "All" || rule.status === ruleFilter
  );

  const passedCount = isCustomPolicy
    ? activeRules.filter((r) => r.status === "Passed").length
    : complianceFindings.filter((c) => c.status === "Passed").length;
  const warningCount = isCustomPolicy
    ? activeRules.filter((r) => r.status === "Warning").length
    : complianceFindings.filter((c) => c.status === "Warning").length;
  const blockedCount = isCustomPolicy
    ? activeRules.filter((r) => r.status === "Blocked").length
    : complianceFindings.filter((c) => c.status === "Blocked").length;

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.ruleName.trim()) return;

    const createdRule: CustomPolicyRule = {
      id: `custom-${Date.now()}`,
      ruleName: newRule.ruleName,
      category: newRule.category,
      severity: newRule.severity,
      description: newRule.description || "User-defined custom compliance check.",
      status: "Passed",
    };

    if (onAddCustomRule) {
      onAddCustomRule(createdRule);
    }
    setNewRule({ ruleName: "", category: "Security", severity: "High", description: "" });
    setIsAddingRule(false);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro
        project={project}
        eyebrow={isCustomPolicy ? "Corporate Policy Engine" : "Store review guidelines"}
        title={isCustomPolicy ? "Custom Policy Evaluation Rules" : "Platform Compliance Checklist"}
      />

      {isCustomPolicy && customPolicy && (
        <Card className="border-primary/40 bg-accent/20">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active Policy Rulebook</p>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          label={isCustomPolicy ? "Passed Policy Rules" : "Passed Checks"}
          value={`${passedCount}`}
          icon={ShieldCheck}
        />
        <Metric
          label={isCustomPolicy ? "Policy Warnings" : "Warnings"}
          value={`${warningCount}`}
          icon={AlertTriangle}
        />
        <Metric
          label={isCustomPolicy ? "Blocking Violations" : "Release Blockers"}
          value={`${blockedCount}`}
          icon={ShieldAlert}
        />
      </section>

      {/* Add Custom Rule Form */}
      {isAddingRule && (
        <Card className="border-primary ring-1 ring-primary/25">
          <CardHeader>
            <CardTitle>Add Custom Policy Rule Check</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRule} className="grid gap-4">
              <div className="grid md:grid-cols-3 gap-4">
                <label className="grid gap-1.5 text-sm font-medium">
                  Rule Name / Check Identifier
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
                    type="button"
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
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setInspectingItem(rule)}
                  >
                    Inspect & Fix
                  </Button>
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
          {complianceFindings.map((item) => (
            <Card key={item.id || item.title} className={item.status === "Blocked" ? "border-rose-200 shadow-sm" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-5">{item.detail}</p>
                  </div>
                  <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                </div>
                {item.remediation && (
                  <p className="mt-3 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded p-2">
                    <strong>Remediation:</strong> {item.remediation}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground uppercase tracking-wider">
                  <span>Owner: <strong className="text-foreground">{item.owner}</strong></span>
                  <Button
                    variant="ghost"
                    className="text-xs font-semibold h-7 px-2"
                    onClick={() => setInspectingItem(item)}
                  >
                    Inspect & Remediate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Interactive Rule Inspector Modal */}
      {inspectingItem && (
        <RuleInspectorModal
          isOpen={!!inspectingItem}
          onClose={() => setInspectingItem(null)}
          finding={inspectingItem}
          isCustomPolicy={isCustomPolicy}
          project={project}
          onToggleStatus={(id) => {
            if (onToggleStatus) onToggleStatus(id);
          }}
        />
      )}
    </div>
  );
}

export function TestCasesPage({
  project,
  testCases = [],
  onToggleStatus,
  onAddTestCase,
  onUpdateTestCase,
  onDeleteTestCase,
}: {
  project: Project;
  testCases?: TestCase[];
  onToggleStatus?: (id: string) => void;
  onAddTestCase?: (testCase: TestCase) => void;
  onUpdateTestCase?: (updated: TestCase) => void;
  onDeleteTestCase?: (testCaseId: string) => void;
}) {
  const { user } = useAuth();
  const [filterArea, setFilterArea] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [runningTestCase, setRunningTestCase] = useState<TestCase | null>(null);

  const filteredTests = testCases.filter((tc) => {
    const matchesArea = filterArea === "All" || tc.area === filterArea;
    const matchesQuery = tc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArea && matchesQuery;
  });

  const passedTestsCount = testCases.filter((tc) => tc.status === "Passed").length;
  const blockedTestsCount = testCases.filter((tc) => tc.status === "Blocked").length;
  const readyTestsCount = testCases.filter((tc) => tc.status === "Ready" || tc.status === "Needs review").length;
  const passRate = testCases.length ? Math.round((passedTestsCount / testCases.length) * 100) : 0;

  const exportTestSuite = () => {
    const jsonStr = JSON.stringify(testCases, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-test-cases.json`;
    a.click();
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Quality Assurance</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">Generated QA Validation Suite</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Interactive step-by-step test execution for <span className="font-semibold text-foreground">{project.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsNewModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add QA Test Case
          </Button>
        </div>
      </div>

      {/* QA Metric Summary Bar */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Total Test Cases</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{testCases.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated & manual checks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Passed Validation</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{passedTestsCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{passRate}% QA confidence rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Failing / Blocked</p>
            <p className="text-2xl font-bold mt-1 text-rose-600">{blockedTestsCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{blockedTestsCount > 0 ? "Requires fix before release" : "Zero failing tests"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium">Pending Execution</p>
            <p className="text-2xl font-bold mt-1 text-primary">{readyTestsCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ready for verification</p>
          </CardContent>
        </Card>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-md text-xs">
          {(["All", "Smoke", "Permissions", "Location", "Security", "Privacy", "Store Policy"] as const).map((area) => (
            <button
              type="button"
              key={area}
              onClick={() => setFilterArea(area)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filterArea === area ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search test cases..."
              className="bg-transparent outline-none text-xs"
            />
          </label>
          <Button variant="secondary" onClick={exportTestSuite}>
            <Download className="h-4 w-4 mr-1" /> Export Suite
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Release Validation Test Suite ({filteredTests.length})</CardTitle>
            <span className="text-xs text-muted-foreground">Click "Run / Step Runner" to verify checklist</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {filteredTests.map((testCase) => (
            <div
              key={testCase.id}
              className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center hover:border-primary/40 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground">{testCase.title}</p>
                  <span className="text-[10px] text-muted-foreground font-mono">({testCase.id})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-accent font-medium text-foreground">{testCase.area}</span>
                  {testCase.expectedResult && <span className="line-clamp-1 max-w-md">Expected: {testCase.expectedResult}</span>}
                </div>
                {testCase.executedBy && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                    <Clock className="h-3 w-3 text-primary" /> Verified by <strong>{testCase.executedBy}</strong> ({testCase.executedAt})
                  </p>
                )}
              </div>

              <Badge tone={testCase.priority === "High" ? "danger" : "neutral"}>
                {testCase.priority} Priority
              </Badge>

              <button
                type="button"
                onClick={() => onToggleStatus && onToggleStatus(testCase.id)}
                className="cursor-pointer transition hover:opacity-80 focus:outline-none"
                title="Toggle Quick Status"
              >
                <Badge tone={toneForStatus(testCase.status)}>{testCase.status}</Badge>
              </button>

              <Button
                variant="secondary"
                className="text-xs h-8"
                onClick={() => setRunningTestCase(testCase)}
              >
                <Play className="h-3.5 w-3.5 mr-1 text-primary" /> Step Runner
              </Button>

              {onDeleteTestCase && (
                <button
                  type="button"
                  onClick={() => onDeleteTestCase(testCase.id)}
                  className="p-1.5 text-muted-foreground hover:text-rose-600 transition"
                  title="Delete Test Case"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {filteredTests.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No test cases match your filter criteria.</p>
          )}
        </CardContent>
      </Card>

      {/* Step Runner Modal */}
      {runningTestCase && (
        <TestCaseExecutionModal
          isOpen={!!runningTestCase}
          onClose={() => setRunningTestCase(null)}
          testCase={runningTestCase}
          onUpdateTestCase={(updated) => {
            if (onUpdateTestCase) onUpdateTestCase(updated);
          }}
          currentUserName={user?.name || "QA Engineer"}
        />
      )}

      {/* New Test Case Modal */}
      {isNewModalOpen && (
        <NewTestCaseModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onAddTestCase={(newTc) => {
            if (onAddTestCase) onAddTestCase(newTc);
          }}
        />
      )}
    </div>
  );
}

export function CopyReviewPage({ project }: { project: Project }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageIntro project={project} eyebrow="Store listing & copy" title="Store Listing Quality Review" />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Copy Review Findings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {defaultCopyFindings.map((finding) => (
              <div key={finding.field} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm text-foreground">{finding.field}</p>
                  <Badge tone={toneForStatus(finding.status)}>{finding.status}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{finding.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Live Store Listing Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-background p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <MessageSquareText className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-base">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.category} · {project.platform}</p>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What's New in Version {project.version}</p>
                <p className="text-xs leading-6 text-foreground bg-accent/40 rounded p-3">{project.releaseNotes}</p>
              </div>
              <div className="space-y-1 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Package Identifier</p>
                <p className="text-xs font-mono text-muted-foreground">{project.packageId}</p>
              </div>
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
      <PageIntro project={project} eyebrow="Audit Trail" title="Release Audit History" />
      <Card>
        <CardContent className="grid gap-4 p-6">
          {defaultHistoryItems.map((item) => (
            <div
              key={`${item.event}-${item.time}`}
              className="grid gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:items-start"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-accent text-primary">
                {item.person.includes("ReleaseIQ") ? <FileCheck2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{item.event}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-5">{item.detail}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Actor: <strong>{item.person}</strong></p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{item.time}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 rounded-md border border-border bg-card p-4 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        Activity audit log is automatically updated as manifests, policies, and QA sign-offs occur.
      </div>
    </div>
  );
}
