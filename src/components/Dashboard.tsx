import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileUp,
  ListChecks,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { ComplianceFinding, Project, TestCase } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  if (status === "Warning" || status === "Needs review") return "warning";
  return "neutral";
}

export function Dashboard({
  activeProject,
  projects,
  complianceFindings = [],
  testCases = [],
  onSelectProject,
  onViewProjects,
  onNavigateToUploads,
  onNavigateToTestCases,
  onNavigateToReport,
}: {
  activeProject: Project;
  projects: Project[];
  complianceFindings?: ComplianceFinding[];
  testCases?: TestCase[];
  onSelectProject: (projectId: string) => void;
  onViewProjects: () => void;
  onNavigateToUploads: () => void;
  onNavigateToTestCases: () => void;
  onNavigateToReport: () => void;
}) {
  const isCustomPolicy = activeProject.platform === "Custom Policy" || !!activeProject.customPolicy;

  const displayFindings = isCustomPolicy && activeProject.customPolicy
    ? activeProject.customPolicy.rules.map((rule) => ({
        id: rule.id,
        title: rule.ruleName,
        status: rule.status,
        severity: rule.severity,
        owner: rule.category,
      }))
    : complianceFindings;

  const openBlockers = displayFindings.filter((f) => f.status === "Blocked").length;
  const passedChecks = displayFindings.filter((f) => f.status === "Passed").length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={toneForStatus(activeProject.status)}>{activeProject.status}</Badge>
                <span className="inline-flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs font-medium text-foreground">
                  {isCustomPolicy && <ShieldCheck className="h-3 w-3 text-primary" />}
                  {activeProject.platform}
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-normal">{activeProject.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isCustomPolicy && activeProject.customPolicy
                  ? `${activeProject.packageId} is being evaluated against custom uploaded policy "${activeProject.customPolicy.fileName}" under rulebook "${activeProject.customPolicy.policyName}".`
                  : `${activeProject.packageId} is being evaluated for ${activeProject.platform} release with compliance, permissions, QA, and report modules.`}
              </p>

              {isCustomPolicy && activeProject.customPolicy && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 rounded-md p-2 border border-primary/20">
                  <FileText className="h-4 w-4" />
                  <span>Custom Policy File: {activeProject.customPolicy.fileName} ({activeProject.customPolicy.rules.length} rules evaluated)</span>
                </div>
              )}
            </div>

            <div className="min-w-40 rounded-md border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Readiness score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-semibold">{activeProject.readinessScore}</span>
                <span className="pb-1 text-sm text-muted-foreground">/100</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${activeProject.readinessScore}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={onNavigateToUploads}>
              <FileUp className="h-4 w-4" />
              {isCustomPolicy ? "Upload updated policy" : "Upload manifest & policy"}
            </Button>
            <Button variant="secondary" onClick={onNavigateToTestCases}>
              <ListChecks className="h-4 w-4" />
              Generate QA cases
            </Button>
            <Button variant="ghost" onClick={onNavigateToReport}>
              View audit report
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isCustomPolicy ? "Evaluation Timeline" : "Release Timeline"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Target submission / review</p>
              <p className="mt-1 text-lg font-semibold">{activeProject.releaseTarget}</p>
            </div>
            <div className="space-y-3">
              {(isCustomPolicy
                ? ["Upload policy file", "Parse custom rulebook", "Execute automated checks", "Generate audit sign-off"]
                : ["Upload artifacts", "Resolve blockers", "QA sign-off", "Generate final report"]
              ).map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${index < 2 || (index === 2 && openBlockers === 0) ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Summary Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Active Projects</p>
            <p className="mt-2 text-2xl font-bold">{projects.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Multi-platform release suites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Passed Checks</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{passedChecks}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Passing guideline criteria</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Open Blockers</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">{openBlockers}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{openBlockers > 0 ? "Requires remediation" : "No release blockers"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase text-muted-foreground">Generated QA Cases</p>
            <p className="mt-2 text-2xl font-bold text-primary">{testCases.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Validation suite active</p>
          </CardContent>
        </Card>
      </section>

      {/* Findings Table and QA test previews */}
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{isCustomPolicy ? "Custom Policy Rule Findings" : "Compliance Findings"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Rule / Check</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">Category / Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {displayFindings.map((check) => (
                    <tr key={check.title} className="border-b border-border last:border-0">
                      <td className="px-5 py-4 font-medium">{check.title}</td>
                      <td className="px-5 py-4">
                        <Badge tone={toneForStatus(check.status)}>{check.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{check.severity}</td>
                      <td className="px-5 py-4 text-muted-foreground">{check.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>QA Test Suite Preview</CardTitle>
              <Button variant="ghost" className="text-xs" onClick={onNavigateToTestCases}>
                View all ({testCases.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {testCases.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium leading-5">{item.title}</p>
                  <span className="text-[10px] text-muted-foreground">{item.area} · {item.priority} Priority</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Project Switcher Grid */}
      <section className="grid gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <button
            type="button"
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/25 rounded-lg"
            aria-label={`Open ${project.name}`}
          >
            <Card className={project.id === activeProject.id ? "border-primary ring-1 ring-primary/25 shadow-md" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{project.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">{project.packageId}</p>
                  </div>
                  <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  {project.readinessScore >= 85 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : project.readinessScore >= 75 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                  )}
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Readiness</span>
                      <span className="font-semibold text-foreground">{project.readinessScore}%</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${project.readinessScore}%` }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>
    </div>
  );
}
