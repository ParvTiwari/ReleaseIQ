import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Download,
  FileCheck2,
  FileCode2,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Layers,
  ListChecks,
  Lock,
  Printer,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import type {
  ComplianceFinding,
  ManifestArtifact,
  PrivacyPolicyArtifact,
  Project,
  TestCase,
} from "../types/release";
import {
  explainComplianceFindingInLayman,
  explainPermissionInLayman,
  explainPrivacyClauseInLayman,
} from "../lib/laymanExplainer";
import { generateHtmlReport, generateMarkdownReport } from "../lib/exportReport";
import { useAuth } from "../context/AuthContext";
import { notifyToast } from "../lib/alerts";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

type ViewMode = "pm" | "tech" | "all";

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
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("pm");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "blocked" | "warning" | "passed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [expandedTechDetails, setExpandedTechDetails] = useState<Record<string, boolean>>({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // PM Checklist state
  const [checkedSignOffs, setCheckedSignOffs] = useState<Record<string, boolean>>({
    legal: false,
    permissions: false,
    qa: false,
    storeAssets: false,
  });

  const highBlockers = complianceFindings.filter((c) => c.status === "Blocked" || c.severity === "High");
  const warnings = complianceFindings.filter((c) => c.status === "Warning" || (c.severity === "Medium" && c.status !== "Blocked"));
  const passedChecks = complianceFindings.filter((c) => c.status === "Passed");

  const isApproved = highBlockers.length === 0 && project.readinessScore >= 80;

  // Toggle issue card open/closed
  const toggleIssue = (id: string) => {
    setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle technical details accordion inside an issue
  const toggleTechDetails = (id: string) => {
    setExpandedTechDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheck = (key: string) => {
    setCheckedSignOffs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered findings
  const filteredFindings = complianceFindings.filter((finding) => {
    if (filterSeverity === "blocked" && !(finding.status === "Blocked" || finding.severity === "High")) return false;
    if (filterSeverity === "warning" && !(finding.status === "Warning" || (finding.severity === "Medium" && finding.status !== "Blocked"))) return false;
    if (filterSeverity === "passed" && finding.status !== "Passed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const layman = explainComplianceFindingInLayman(finding);
      const matchesTitle = finding.title.toLowerCase().includes(q) || layman.plainTitle.toLowerCase().includes(q);
      const matchesDetail = finding.detail.toLowerCase().includes(q) || layman.whatWentWrong.toLowerCase().includes(q);
      const matchesOwner = finding.owner.toLowerCase().includes(q) || layman.whoFixesIt.toLowerCase().includes(q);
      return matchesTitle || matchesDetail || matchesOwner;
    }
    return true;
  });

  // Department task counts
  const departmentCounts: Record<string, number> = {};
  complianceFindings
    .filter((f) => f.status !== "Passed")
    .forEach((f) => {
      const layman = explainComplianceFindingInLayman(f);
      departmentCounts[layman.whoFixesIt] = (departmentCounts[layman.whoFixesIt] || 0) + 1;
    });

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  const handleExportHtml = () => {
    setIsExportMenuOpen(false);
    const htmlContent = generateHtmlReport({
      project,
      manifest,
      privacyPolicy,
      complianceFindings,
      testCases,
      generatedBy: user?.name || "Parth Gupta",
    });

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-readiness-report.html`;
    a.click();
    URL.revokeObjectURL(url);

    notifyToast({
      title: "Executive HTML Report downloaded — opens directly in any browser!",
      icon: "success",
    });
  };

  const handleExportMarkdown = () => {
    setIsExportMenuOpen(false);
    const mdContent = generateMarkdownReport({
      project,
      manifest,
      privacyPolicy,
      complianceFindings,
      testCases,
      generatedBy: user?.name || "Parth Gupta",
    });

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-readiness-summary.md`;
    a.click();
    URL.revokeObjectURL(url);

    notifyToast({
      title: "Markdown report downloaded — perfect for Slack, Jira & Notion!",
      icon: "success",
    });
  };

  const handleExportJson = () => {
    setIsExportMenuOpen(false);
    const reportData = {
      reportType: "ReleaseIQ Product Manager & Technical Release Audit Certificate",
      generatedAt: new Date().toISOString(),
      auditedBy: user?.name || "Parth Gupta",
      auditHash: `AUDIT-${project.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      executiveSummaryLayman: {
        launchVerdict: isApproved ? "READY_FOR_STORE_SUBMISSION" : "LAUNCH_BLOCKED_ACTION_REQUIRED",
        readinessScore: `${project.readinessScore}/100`,
        plainEnglishSummary: isApproved
          ? "All store compliance checks passed. Safe to submit to Google Play / Apple App Store."
          : `${highBlockers.length} critical blocker(s) and ${warnings.length} warning(s) detected. Submission will likely be rejected without remediation.`,
        actionOwners: departmentCounts,
      },
      project: {
        id: project.id,
        name: project.name,
        packageId: project.packageId,
        version: project.version,
        platform: project.platform,
        category: project.category,
        releaseTarget: project.releaseTarget,
      },
      plainEnglishFindings: complianceFindings.map((cf) => {
        const layman = explainComplianceFindingInLayman(cf);
        return {
          id: cf.id,
          plainTitle: layman.plainTitle,
          status: cf.status,
          severity: cf.severity,
          assignedDepartment: layman.whoFixesIt,
          whatWentWrong: layman.whatWentWrong,
          whyItMatters: layman.whyItMatters,
          actionSteps: layman.actionSteps,
          storeImpact: layman.storeImpact,
          estimatedEffort: layman.estimatedEffort,
          technicalDetails: {
            rawTitle: cf.title,
            rawDetail: cf.detail,
            remediation: cf.remediation || null,
          },
        };
      }),
      manifestAudit: {
        targetSdkVersion: manifest?.targetSdkVersion ?? 34,
        permissionsCount: manifest?.permissions.length || 0,
        permissions: (manifest?.permissions || []).map((p) => ({
          name: p.name,
          risk: p.risk,
          laymanInfo: explainPermissionInLayman(p),
        })),
      },
      privacyPolicyAudit: {
        documentName: privacyPolicy?.fileName || null,
        clauses: (privacyPolicy?.clauses || []).map((c) => ({
          title: c.title,
          status: c.status,
          laymanInfo: explainPrivacyClauseInLayman(c),
        })),
      },
      qaValidationSuite: {
        totalTestCases: testCases.length,
        passedTests: testCases.filter((tc) => tc.status === "Passed").length,
        blockedTests: testCases.filter((tc) => tc.status === "Blocked").length,
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

    notifyToast({
      title: "Raw JSON audit certificate exported",
      icon: "success",
    });
  };

  const checklistTotal = Object.keys(checkedSignOffs).length;
  const checklistDone = Object.values(checkedSignOffs).filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 print:m-0 print:p-0">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" /> Plain-English PM & Executive Report
            </span>
            <span className="text-xs text-muted-foreground font-medium">Updated for Store Reviews</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Release Readiness Report</h1>
          <p className="text-sm text-muted-foreground">
            Clear, non-technical explanation of launch status, policy compliance, and required fixes for <strong className="text-foreground">{project.name}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Persona View Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("pm")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "pm"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Plain English explanation for Product Managers, Non-Tech Stakeholders, and Leadership"
            >
              <Briefcase className="h-3.5 w-3.5" /> PM / Plain English
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tech")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "tech"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Technical identifiers, XML tags, and SDK versions for Developers"
            >
              <Code2 className="h-3.5 w-3.5" /> Developer View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Combined view showing both plain English and technical deep-dives"
            >
              <Layers className="h-3.5 w-3.5" /> All Details
            </button>
          </div>

          <Button variant="secondary" onClick={handlePrint} title="Generate clean printable visual report or save as PDF">
            <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
          </Button>

          {/* Smart Export Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              title="Download report in your preferred format (HTML, PDF, Markdown, JSON)"
              className="flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
              <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-80" />
            </Button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="text-xs font-bold text-foreground">Export Readiness Report</p>
                  <p className="text-[11px] text-muted-foreground">Select export format for your workflow</p>
                </div>

                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-accent transition"
                >
                  <div className="p-1.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0 mt-0.5">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">Interactive Web Report</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        .html (Recommended)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Opens immediately in any browser with colors, charts & actions.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-accent transition"
                >
                  <div className="p-1.5 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">Executive Summary</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground">
                        .md
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Clean formatted text for Slack, Jira tickets & Notion docs.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-accent transition"
                >
                  <div className="p-1.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 shrink-0 mt-0.5">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground">Raw Audit Data</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground">
                        .json
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Machine-readable payload for CI/CD pipelines & automations.
                    </p>
                  </div>
                </button>

                <div className="border-t border-border pt-1 mt-1">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print / Save as PDF via Browser</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚨 EXECUTIVE PLAIN-ENGLISH VERDICT CARD */}
      <Card className={`overflow-hidden border-2 shadow-md print:border print:shadow-none ${
        isApproved
          ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-card"
          : "border-rose-500/40 bg-gradient-to-br from-rose-500/5 via-card to-card"
      }`}>
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40 animate-pulse"
                }`}>
                  {isApproved ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  {isApproved ? "Safe to Submit to App Stores" : "Launch Blocked — Action Required"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Target Launch: <strong className="text-foreground">{project.releaseTarget}</strong>
                </span>
                <span className="text-xs text-muted-foreground">
                  · {project.platform} ({project.packageId})
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-foreground">
                  {isApproved
                    ? "🚀 All Clear: Your build meets store compliance guidelines"
                    : `🚨 What Went Wrong: ${highBlockers.length} Critical Store Violation${highBlockers.length === 1 ? "" : "s"} Detected`}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-w-3xl">
                  {isApproved
                    ? "This release has passed automated store policy audits, manifest permission checks, privacy disclosures, and QA test validation. No showstoppers were found."
                    : "If submitted to Google Play or Apple App Store today, this build will likely be REJECTED during store review. Follow the plain-English action items below to unblock the launch."}
                </p>
              </div>

              {/* Department Action Breakdown */}
              {Object.keys(departmentCounts).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> Action items assigned to:
                  </span>
                  {Object.entries(departmentCounts).map(([dept, count]) => (
                    <span
                      key={dept}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground border border-border"
                    >
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <strong>{dept}</strong>: {count} {count === 1 ? "task" : "tasks"}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score & Health Stats */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-card/80 p-5 shrink-0 shadow-sm">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Readiness Score</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-black ${
                    project.readinessScore >= 80 ? "text-emerald-600" : project.readinessScore >= 60 ? "text-amber-600" : "text-rose-600"
                  }`}>
                    {project.readinessScore}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">/100</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Target: 80+</p>
              </div>

              <div className="h-14 w-px bg-border" />

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">Critical Blockers:</span>
                  <span className="font-bold text-rose-600">{highBlockers.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">Review Warnings:</span>
                  <span className="font-bold text-amber-600">{warnings.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted-foreground">Passed Checks:</span>
                  <span className="font-bold text-emerald-600">{passedChecks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick PM Summary Pills */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/80 pt-4">
            <div className="rounded-lg bg-card/60 p-3 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">Store Rejection Risk</p>
              <p className={`text-sm font-bold mt-0.5 ${highBlockers.length > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {highBlockers.length > 0 ? "High (Immediate Rejection)" : "Low (Store Compliant)"}
              </p>
            </div>
            <div className="rounded-lg bg-card/60 p-3 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">Estimated Fix Time</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {highBlockers.length > 0 ? "~45 mins total" : "0 mins (All clear)"}
              </p>
            </div>
            <div className="rounded-lg bg-card/60 p-3 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">Target SDK Level</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                Android 14 (SDK {manifest?.targetSdkVersion ?? 34})
              </p>
            </div>
            <div className="rounded-lg bg-card/60 p-3 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">QA Suite Status</p>
              <p className="text-sm font-bold text-primary mt-0.5">
                {testCases.filter(t => t.status === "Passed").length}/{testCases.length} Tests Passed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📋 PM LAUNCH SIGN-OFF CHECKLIST */}
      <Card className="border-border">
        <CardHeader className="bg-accent/30 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold">Product Manager Pre-Flight Sign-Off</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sign-off Progress:</span>
              <span className="font-bold text-foreground">{checklistDone} of {checklistTotal} confirmed</span>
              <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/40 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedSignOffs.legal}
              onChange={() => toggleCheck("legal")}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground">1. Legal & Privacy Policy Approval</p>
              <p className="text-muted-foreground">Privacy policy page is live with third-party SDK and data sharing disclosures.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/40 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedSignOffs.permissions}
              onChange={() => toggleCheck("permissions")}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground">2. Sensitive Permissions Verified</p>
              <p className="text-muted-foreground">All requested device permissions have a clear user-facing reason in the app.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/40 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedSignOffs.qa}
              onChange={() => toggleCheck("qa")}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground">3. QA Test Suite Sign-Off</p>
              <p className="text-muted-foreground">Regression tests, smoke tests, and offline behaviors verified on real devices.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/40 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={checkedSignOffs.storeAssets}
              onChange={() => toggleCheck("storeAssets")}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-foreground">4. Console Assets & Demo Videos</p>
              <p className="text-muted-foreground">Store listing copy, screenshots, and justification videos uploaded in Play/App Store Console.</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* 🧩 SECTION 1: WHAT WENT WRONG — PLAIN ENGLISH FINDINGS & ACTION PLAN */}
      <Card className="border-border shadow-panel">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">
                {viewMode === "tech" ? "Compliance & Policy Findings Audit" : "What Went Wrong: Plain-English Findings & Action Items"}
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === "tech"
                ? "Raw rule IDs, severity codes, and manifest guideline references."
                : "Every issue explained in simple business terms: what happened, why it matters, and who fixes it."}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterSeverity("all")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterSeverity === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({complianceFindings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity("blocked")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterSeverity === "blocked" ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              🛑 Blockers ({highBlockers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity("warning")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterSeverity === "warning" ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              ⚠️ Warnings ({warnings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSeverity("passed")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filterSeverity === "passed" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              ✅ Passed ({passedChecks.length})
            </button>
          </div>
        </CardHeader>

        {/* Search bar inside Card */}
        <div className="px-5 pt-2 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search findings (e.g., location, privacy, legal, crash reporting, camera)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <CardContent className="p-5 space-y-4">
          {filteredFindings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-foreground">No issues found matching your filter</p>
              <p className="text-xs text-muted-foreground mt-1">Try switching to &quot;All&quot; or clearing your search term.</p>
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const layman = explainComplianceFindingInLayman(finding);
              const isBlocker = finding.status === "Blocked" || finding.severity === "High";
              const isWarning = finding.status === "Warning" || (finding.severity === "Medium" && finding.status !== "Blocked");
              const isPassed = finding.status === "Passed";
              const isExpanded = expandedIssues[finding.id] !== false; // default expanded
              const showTech = expandedTechDetails[finding.id];

              return (
                <div
                  key={finding.id}
                  className={`rounded-xl border transition-all ${
                    isBlocker
                      ? "border-rose-300/80 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/50"
                      : isWarning
                      ? "border-amber-300/80 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/50"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={isBlocker ? "danger" : isWarning ? "warning" : "success"}>
                            {isBlocker ? "🛑 Store Rejection Blocker" : isWarning ? "⚠️ Review Warning" : "✅ Store Compliant"}
                          </Badge>

                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                            <Briefcase className="h-3 w-3 text-primary" />
                            Assigned to: {layman.whoFixesIt}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Est. Fix Time: <strong>{layman.estimatedEffort}</strong>
                          </span>
                        </div>

                        {/* Title (Plain English if in PM or All mode, otherwise Tech title) */}
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          {viewMode === "tech" ? finding.title : layman.plainTitle}
                        </h3>

                        {viewMode !== "tech" && (
                          <p className="text-xs text-muted-foreground">
                            Technical item: <span className="font-mono text-[11px] font-medium text-foreground">{finding.title}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          isBlocker
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200"
                            : isWarning
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                        }`}>
                          {layman.storeImpact}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleIssue(finding.id)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
                          title="Toggle Details"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Body */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
                        {/* 1. What Went Wrong (Plain English) */}
                        <div className="rounded-lg bg-card p-3.5 border border-border">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                            <HelpCircle className="h-3.5 w-3.5 text-primary" /> What Went Wrong in Plain English:
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {layman.whatWentWrong}
                          </p>
                        </div>

                        {/* 2. Why This Matters to the Business & Store Submission */}
                        {!isPassed && (
                          <div className={`rounded-lg p-3.5 border ${
                            isBlocker
                              ? "bg-rose-500/10 border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-200"
                              : "bg-amber-500/10 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200"
                          }`}>
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Why This Matters for Your Launch:
                            </div>
                            <p className="text-xs font-medium leading-relaxed">
                              {layman.whyItMatters}
                            </p>
                          </div>
                        )}

                        {/* 3. Action Plan: Step by Step */}
                        {!isPassed && layman.actionSteps.length > 0 && (
                          <div className="rounded-lg bg-card p-3.5 border border-border space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                              <Wrench className="h-3.5 w-3.5 text-primary" /> How to Fix It (Action Plan for {layman.whoFixesIt}):
                            </div>
                            <ol className="space-y-1.5 text-xs text-foreground list-decimal list-inside pl-1">
                              {layman.actionSteps.map((step, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  <span className="text-muted-foreground font-normal">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* 4. Layman Jargon Explainer (if available) */}
                        {layman.jargonExplained && layman.jargonExplained.length > 0 && (
                          <div className="rounded-lg bg-accent/40 p-3 border border-border/80">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-primary" /> Plain English Terminology Guide:
                            </div>
                            <div className="grid gap-1.5 sm:grid-cols-2">
                              {layman.jargonExplained.map((jargon, jIdx) => (
                                <div key={jIdx} className="text-xs bg-card p-2 rounded border border-border">
                                  <strong className="text-foreground font-mono">{jargon.term}:</strong>{" "}
                                  <span className="text-muted-foreground">{jargon.explanation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Developer & Technical Deep Dive (Accordion) */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => toggleTechDetails(finding.id)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                            {showTech ? "Hide Technical Manifest & Code Details" : "Show Technical Manifest & Code Details for Developers"}
                            {showTech ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          {showTech && (
                            <div className="mt-2 rounded-lg bg-muted/60 p-3 text-xs font-mono text-foreground border border-border space-y-1">
                              <p><span className="text-muted-foreground">Rule ID:</span> {finding.id}</p>
                              <p><span className="text-muted-foreground">Technical Name:</span> {finding.title}</p>
                              <p><span className="text-muted-foreground">Original Detail:</span> {finding.detail}</p>
                              {finding.remediation && (
                                <p><span className="text-muted-foreground">Raw Remediation:</span> {finding.remediation}</p>
                              )}
                              {finding.guidelineRef && (
                                <p><span className="text-muted-foreground">Guideline Reference:</span> {finding.guidelineRef}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 📱 SECTION 2: PLAIN-ENGLISH PERMISSIONS BREAKDOWN */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">
                  {viewMode === "tech" ? "App Manifest & Permissions Audit" : "App Permissions Guide: What the App Accesses"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {viewMode === "tech"
                    ? `Target SDK ${manifest?.targetSdkVersion ?? 34} · ${manifest?.permissions.length || 0} permissions declared`
                    : "Plain-English explanation of device features (GPS, camera, photos) requested from users."}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-secondary px-2.5 py-1 rounded text-secondary-foreground border border-border">
              {manifest ? `${manifest.name} (SDK ${manifest.targetSdkVersion ?? 34})` : "No Manifest Uploaded"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {manifest && manifest.permissions.length > 0 ? (
            <div className="grid gap-3">
              {manifest.permissions.map((perm) => {
                const layman = explainPermissionInLayman(perm);
                return (
                  <div
                    key={perm.name}
                    className="flex flex-col md:flex-row md:items-start justify-between gap-3 rounded-lg border border-border bg-card p-3.5 hover:bg-accent/20 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {viewMode === "tech" ? perm.name : layman.friendlyName}
                        </span>
                        <Badge
                          tone={
                            layman.riskBadgeColor === "rose"
                              ? "danger"
                              : layman.riskBadgeColor === "amber"
                              ? "warning"
                              : "success"
                          }
                        >
                          {perm.risk} Risk
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground font-medium">{layman.plainMeaning}</p>
                      <p className="text-[11px] text-muted-foreground">
                        <strong className="text-foreground">User Experience:</strong> {layman.userImpact}
                      </p>
                      <p className="text-[11px] text-primary">
                        <strong className="text-foreground">Store Requirement:</strong> {layman.storePolicyNotes}
                      </p>
                    </div>

                    <div className="text-right shrink-0 text-xs">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border block md:inline-block">
                        {perm.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-3">No manifest artifact has been uploaded for permission verification.</p>
          )}
        </CardContent>
      </Card>

      {/* 🛡️ SECTION 3: PLAIN-ENGLISH PRIVACY POLICY AUDIT */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base font-bold">
                  {viewMode === "tech" ? "Privacy Policy & Data Safety Audit" : "Privacy Policy Disclosures (Plain English)"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Verification against store privacy rules, account deletion mandates, and third-party data tracking.
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Document: <strong className="text-foreground">{privacyPolicy?.fileName || "Privacy Policy URL"}</strong>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {privacyPolicy && privacyPolicy.clauses.length > 0 ? (
            <div className="grid gap-3">
              {privacyPolicy.clauses.map((clause) => {
                const layman = explainPrivacyClauseInLayman(clause);
                return (
                  <div
                    key={clause.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border border-border bg-card p-3.5"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {viewMode === "tech" ? clause.title : layman.plainTitle}
                        </span>
                        <Badge tone={toneForStatus(clause.status)}>{clause.status}</Badge>
                      </div>
                      <p className="text-xs text-foreground">{layman.plainMeaning}</p>
                      <p className="text-[11px] text-muted-foreground">
                        <strong className="text-primary">PM Takeaway:</strong> {layman.pmTakeaway}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-3">Privacy policy document not yet submitted for clause auditing.</p>
          )}
        </CardContent>
      </Card>

      {/* 🧪 SECTION 4: QA VALIDATION SUITE */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">QA Validation Suite ({testCases.length} Tests)</CardTitle>
                <p className="text-xs text-muted-foreground">Pre-submission functional and regression test matrix.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {testCases.filter((tc) => tc.status === "Passed").length} / {testCases.length} Tests Passed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {testCases.map((tc) => (
              <div
                key={tc.id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      tc.status === "Passed"
                        ? "text-emerald-600"
                        : tc.status === "Blocked"
                        ? "text-rose-600"
                        : "text-amber-600"
                    }`}
                  />
                  <span className="font-medium text-foreground">{tc.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground hidden sm:inline">{tc.area}</span>
                  <Badge tone={toneForStatus(tc.status)}>{tc.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Print / Sign-off Footer */}
      <div className="rounded-lg border border-border bg-card p-5 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:block">
        <div>
          <p className="font-semibold text-foreground">© 2026 ReleaseIQ Quality & Compliance Assurance Engine</p>
          <p className="text-muted-foreground mt-0.5">Pre-flight verification certificate generated for {project.name}.</p>
        </div>
        <p className="font-mono text-[11px] bg-secondary px-2.5 py-1 rounded border border-border self-start sm:self-auto">
          Audit Hash: {project.id.slice(0, 8).toUpperCase()}-{Date.now().toString(36).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
