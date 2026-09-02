import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileCode2,
  FileText,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type {
  ComplianceFinding,
  ManifestArtifact,
  PrivacyPolicyArtifact,
  Project,
  TestCase,
} from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

export function ReportPage({
  project,
  manifest,
  privacyPolicy,
  complianceFindings,
  testCases,
}: {
  project: Project;
  manifest?: ManifestArtifact;
  privacyPolicy?: PrivacyPolicyArtifact;
  complianceFindings: ComplianceFinding[];
  testCases: TestCase[];
}) {
  const isApproved = project.readinessScore >= 80 && project.status !== "Blocked";
  const highBlockers = complianceFindings.filter((c) => c.status === "Blocked");
  const warnings = complianceFindings.filter((c) => c.status === "Warning");
  const passedChecks = complianceFindings.filter((c) => c.status === "Passed");

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const reportData = {
      reportType: "ReleaseIQ Release Readiness Audit Certificate",
      generatedAt: new Date().toISOString(),
      auditHash: `AUDIT-${project.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      project: {
        id: project.id,
        name: project.name,
        packageId: project.packageId,
        version: project.version,
        platform: project.platform,
        category: project.category,
        releaseTarget: project.releaseTarget,
        readinessScore: project.readinessScore,
        status: project.status,
        recommendation: isApproved ? "APPROVED_FOR_SUBMISSION" : "SUBMISSION_BLOCKED",
      },
      manifestAudit: {
        artifactName: manifest?.name || null,
        targetSdkVersion: manifest?.targetSdkVersion ?? 34,
        minSdkVersion: manifest?.minSdkVersion ?? 26,
        permissionsCount: manifest?.permissions.length || 0,
        permissions: manifest?.permissions || [],
      },
      privacyPolicyAudit: {
        documentName: privacyPolicy?.fileName || null,
        clausesEvaluated: privacyPolicy?.clauses.length || 0,
        clauses: privacyPolicy?.clauses || [],
      },
      complianceFindings: complianceFindings.map((cf) => ({
        id: cf.id,
        title: cf.title,
        status: cf.status,
        severity: cf.severity,
        owner: cf.owner,
        detail: cf.detail,
        remediation: cf.remediation || null,
      })),
      qaValidationSuite: {
        totalTestCases: testCases.length,
        passedTests: testCases.filter((tc) => tc.status === "Passed").length,
        blockedTests: testCases.filter((tc) => tc.status === "Blocked").length,
        testCases: testCases,
      },
    };

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-readiness-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 print:m-0 print:p-0">
      {/* Header with Export Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Audit Certificate & Summary</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">Release Readiness Report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Official pre-flight assessment certificate generated for {project.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePrint} title="Generate printable visual document or browser PDF">
            <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
          </Button>
          <Button onClick={handleExportJson} title="Download machine-readable JSON data for CI/CD or Jira">
            <Download className="h-4 w-4 mr-1.5" /> Export JSON Report
          </Button>
        </div>
      </div>

      {/* Executive Summary Card */}
      <Card className="border-2 border-border print:border-none print:shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  ReleaseIQ Audit Certificate
                </span>
                <span className="text-xs text-muted-foreground">Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground">{project.name}</h3>
              <p className="text-xs font-mono text-muted-foreground">{project.packageId} · Version {project.version} · {project.platform}</p>
              <p className="text-sm text-muted-foreground max-w-xl pt-1 leading-6">
                Target submission scheduled for <strong>{project.releaseTarget}</strong>. Evaluated against store review guidelines, declared manifest permissions, privacy disclosures, and QA test suites.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-accent/40 p-4 shrink-0">
              <div className="text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">Readiness Score</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{project.readinessScore}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/100</span>
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="space-y-1 text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">Recommendation</p>
                <div>
                  <Badge tone={isApproved ? "success" : "danger"}>
                    {isApproved ? "Approved for Submission" : "Submission Blocked"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Key Findings Bar */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4 border-t border-border pt-4 text-center">
            <div className="rounded-md bg-card p-3 border border-border">
              <p className="text-xs text-muted-foreground">Passed Checks</p>
              <p className="text-lg font-bold text-emerald-600">{passedChecks.length}</p>
            </div>
            <div className="rounded-md bg-card p-3 border border-border">
              <p className="text-xs text-muted-foreground">Warnings</p>
              <p className="text-lg font-bold text-amber-600">{warnings.length}</p>
            </div>
            <div className="rounded-md bg-card p-3 border border-border">
              <p className="text-xs text-muted-foreground">Active Blockers</p>
              <p className="text-lg font-bold text-rose-600">{highBlockers.length}</p>
            </div>
            <div className="rounded-md bg-card p-3 border border-border">
              <p className="text-xs text-muted-foreground">QA Test Cases</p>
              <p className="text-lg font-bold text-primary">{testCases.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Active Blockers & Remediation */}
      {highBlockers.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle>Mandatory Release Blockers ({highBlockers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {highBlockers.map((item) => (
              <div key={item.id} className="rounded-md border border-rose-200 bg-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{item.title}</span>
                  <Badge tone="danger">High Blocker</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                {item.remediation && (
                  <div className="rounded bg-rose-50 p-2 text-xs text-rose-900 border border-rose-200/60 mt-1">
                    <strong>Action Required:</strong> {item.remediation}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section 2: Permissions Audit Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-primary" />
              <CardTitle>Manifest & Permissions Audit</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {manifest ? `${manifest.name} (Target SDK ${manifest.targetSdkVersion ?? 34})` : "No Manifest Uploaded"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {manifest ? (
            <div className="grid gap-2">
              {manifest.permissions.map((perm) => (
                <div key={perm.name} className="flex items-center justify-between border-b border-border py-2 text-xs last:border-0">
                  <span className="font-mono font-medium">{perm.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{perm.description}</span>
                    <Badge tone={perm.risk === "High" ? "danger" : perm.risk === "Medium" ? "warning" : "success"}>
                      {perm.risk}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">No manifest artifact has been uploaded for permission verification.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Privacy Policy Validation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle>Privacy Policy & Data Safety Audit</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {privacyPolicy?.fileName || "Privacy Policy Document"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {privacyPolicy ? (
            <div className="grid gap-2.5">
              {privacyPolicy.clauses.map((clause) => (
                <div key={clause.id} className="flex items-start justify-between border-b border-border pb-2 text-xs last:border-0">
                  <div>
                    <span className="font-semibold text-foreground">{clause.title}</span>
                    <p className="text-muted-foreground mt-0.5">{clause.detail}</p>
                  </div>
                  <Badge tone={toneForStatus(clause.status)}>{clause.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">Privacy policy document not yet submitted for clause auditing.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 4: QA Test Case Suite Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <CardTitle>Generated QA Validation Suite ({testCases.length} Tests)</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">Pre-submission verification</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {testCases.map((tc) => (
            <div key={tc.id} className="flex items-center justify-between border-b border-border py-2 text-xs last:border-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-foreground">{tc.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{tc.area}</span>
                <Badge tone={toneForStatus(tc.status)}>{tc.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sign-off Footer */}
      <div className="rounded-lg border border-border bg-card p-5 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p>© 2026 ReleaseIQ Quality Assurance Engine. Pre-flight verification certificate.</p>
        <p className="font-mono">Audit Hash: {project.id.slice(0, 8)}-{Date.now().toString(36).toUpperCase()}</p>
      </div>
    </div>
  );
}
