import { useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Download,
  FileCheck2,
  FileCode2,
  FileText,
  Globe,
  HelpCircle,
  Layers,
  ListChecks,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
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

type ActiveTab = "issues" | "checklist" | "permissions" | "privacy" | "qa";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("issues");
  const [issueFilter, setIssueFilter] = useState<"all" | "blocked" | "warning" | "passed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<Record<string, boolean>>({});

  // Sign-off checklist
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

  // Department action item counts
  const departmentCounts: Record<string, number> = {};
  complianceFindings
    .filter((f) => f.status !== "Passed")
    .forEach((f) => {
      const layman = explainComplianceFindingInLayman(f);
      departmentCounts[layman.whoFixesIt] = (departmentCounts[layman.whoFixesIt] || 0) + 1;
    });

  const toggleCheck = (key: string) => {
    setCheckedSignOffs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTech = (id: string) => {
    setShowTechnicalDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter findings
  const filteredFindings = complianceFindings.filter((finding) => {
    if (issueFilter === "blocked" && !(finding.status === "Blocked" || finding.severity === "High")) return false;
    if (issueFilter === "warning" && !(finding.status === "Warning" || (finding.severity === "Medium" && finding.status !== "Blocked"))) return false;
    if (issueFilter === "passed" && finding.status !== "Passed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const layman = explainComplianceFindingInLayman(finding);
      return (
        finding.title.toLowerCase().includes(q) ||
        layman.plainTitle.toLowerCase().includes(q) ||
        layman.whatWentWrong.toLowerCase().includes(q) ||
        layman.whoFixesIt.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Copy quick summary for Slack/Standup
  const handleCopySlackSummary = () => {
    const summary = `📊 *${project.name} - Release Readiness Update*
Verdict: ${isApproved ? "🟢 READY FOR STORE SUBMISSION" : "🔴 SUBMISSION BLOCKED (" + highBlockers.length + " Action Items Required)"}
Score: ${project.readinessScore}/100 | Target Launch: ${project.releaseTarget}
Auditor: ${user?.name || "Parth Gupta"}

*Action Items:*
${highBlockers.map((b) => {
  const layman = explainComplianceFindingInLayman(b);
  return `• 🚨 *${layman.plainTitle}* (${layman.whoFixesIt}) - ${layman.whatWentWrong}`;
}).join("\n")}
${warnings.map((w) => {
  const layman = explainComplianceFindingInLayman(w);
  return `• ⚠️ *${layman.plainTitle}* (${layman.whoFixesIt})`;
}).join("\n")}
`;
    navigator.clipboard.writeText(summary);
    notifyToast({
      title: "Quick team summary copied to clipboard!",
      icon: "success",
    });
  };

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  const handleExportHtml = () => {
    setIsExportMenuOpen(false);
    const html = generateHtmlReport({
      project,
      manifest,
      privacyPolicy,
      complianceFindings,
      testCases,
      generatedBy: user?.name || "Parth Gupta",
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-readiness-report.html`;
    a.click();
    URL.revokeObjectURL(url);
    notifyToast({
      title: "Interactive HTML Report downloaded — double click to open in any browser!",
      icon: "success",
    });
  };

  const handleExportMarkdown = () => {
    setIsExportMenuOpen(false);
    const md = generateMarkdownReport({
      project,
      manifest,
      privacyPolicy,
      complianceFindings,
      testCases,
      generatedBy: user?.name || "Parth Gupta",
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-readiness-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
    notifyToast({
      title: "Markdown summary downloaded for Jira/Notion!",
      icon: "success",
    });
  };

  const checklistTotal = Object.keys(checkedSignOffs).length;
  const checklistDone = Object.values(checkedSignOffs).filter(Boolean).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 print:m-0 print:p-0">
      {/* 1. TOP HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Release Readiness Audit
            </span>
            <span className="text-xs text-muted-foreground">{project.platform} · {project.packageId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">{project.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleCopySlackSummary} title="Copy quick status summary for Slack or email">
            <Copy className="h-4 w-4 mr-1.5" /> Copy Summary
          </Button>

          <Button variant="secondary" onClick={handlePrint} title="Print or save as PDF">
            <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
          </Button>

          {/* Export Dropdown */}
          <div className="relative">
            <Button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              <span>Export</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </Button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1"
                onMouseLeave={() => setIsExportMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent transition"
                >
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-foreground">Interactive Web Report (.html)</p>
                    <p className="text-[10px] text-muted-foreground">Opens in Chrome, Edge, Safari</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-accent transition"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-bold text-foreground">Executive Summary (.md)</p>
                    <p className="text-[10px] text-muted-foreground">For Slack, Jira, Notion</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SIMPLE, HIGH-IMPACT VERDICT BANNER */}
      <div
        className={`rounded-xl border p-5 transition-all shadow-sm ${
          isApproved
            ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20"
            : "border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
                }`}
              >
                {isApproved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {isApproved ? "Safe to Submit to App Stores" : "Launch Blocked — Action Required"}
              </span>
              <span className="text-xs text-muted-foreground">Target: <strong>{project.releaseTarget}</strong></span>
            </div>

            <h2 className="text-xl font-extrabold text-foreground">
              {isApproved
                ? "All store compliance checks passed. Ready for submission."
                : `${highBlockers.length} issue${highBlockers.length === 1 ? "" : "s"} will cause app store rejection if submitted now.`}
            </h2>

            {/* Department task badges */}
            {!isApproved && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">Who needs to fix it:</span>
                {Object.entries(departmentCounts).map(([dept, count]) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-card border border-border text-foreground shadow-xs"
                  >
                    <Briefcase className="h-3 w-3 text-primary" /> {dept}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick numbers */}
          <div className="flex items-center gap-3 shrink-0 bg-card rounded-lg border border-border p-3 px-4 shadow-xs">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Score</p>
              <p className={`text-2xl font-black ${isApproved ? "text-emerald-600" : "text-rose-600"}`}>
                {project.readinessScore}
                <span className="text-xs font-normal text-muted-foreground">/100</span>
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Blockers</p>
              <p className="text-lg font-bold text-rose-600">{highBlockers.length}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Warnings</p>
              <p className="text-lg font-bold text-amber-600">{warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CLEAN TAB BAR (No endless scrolling) */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("issues")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "issues"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Issues & Fixes ({complianceFindings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "checklist"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <ListChecks className="h-4 w-4" />
          <span>PM Sign-Off ({checklistDone}/{checklistTotal})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("permissions")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "permissions"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          <span>App Permissions ({manifest?.permissions.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("privacy")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "privacy"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("qa")}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "qa"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>QA Tests ({testCases.filter((t) => t.status === "Passed").length}/{testCases.length})</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: ISSUES & FIXES */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setIssueFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  issueFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                All ({complianceFindings.length})
              </button>
              <button
                type="button"
                onClick={() => setIssueFilter("blocked")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  issueFilter === "blocked" ? "bg-rose-600 text-white" : "text-muted-foreground"
                }`}
              >
                🛑 Blockers ({highBlockers.length})
              </button>
              <button
                type="button"
                onClick={() => setIssueFilter("warning")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  issueFilter === "warning" ? "bg-amber-600 text-white" : "text-muted-foreground"
                }`}
              >
                ⚠️ Warnings ({warnings.length})
              </button>
              <button
                type="button"
                onClick={() => setIssueFilter("passed")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  issueFilter === "passed" ? "bg-emerald-600 text-white" : "text-muted-foreground"
                }`}
              >
                ✅ Passed ({passedChecks.length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-card pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Issue Cards */}
          <div className="space-y-3">
            {filteredFindings.map((finding) => {
              const layman = explainComplianceFindingInLayman(finding);
              const isBlocker = finding.status === "Blocked" || finding.severity === "High";
              const isWarning = finding.status === "Warning" || (finding.severity === "Medium" && finding.status !== "Blocked");
              const isPassed = finding.status === "Passed";
              const showTech = showTechnicalDetails[finding.id];

              return (
                <div
                  key={finding.id}
                  className={`rounded-xl border p-4 sm:p-5 transition-all bg-card ${
                    isBlocker
                      ? "border-rose-300/80 shadow-xs"
                      : isWarning
                      ? "border-amber-300/80 shadow-xs"
                      : "border-border opacity-90"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isBlocker
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                              : isWarning
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                          }`}
                        >
                          {isBlocker ? "🛑 Store Blocker" : isWarning ? "⚠️ Review Warning" : "✅ Store Compliant"}
                        </span>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                          👤 Assigned: <strong>{layman.whoFixesIt}</strong>
                        </span>

                        <span className="text-xs text-muted-foreground">
                          ⏱️ Fix: <strong>{layman.estimatedEffort}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-foreground mt-1">
                        {layman.plainTitle}
                      </h3>
                    </div>

                    <span className="text-xs font-bold text-rose-600 sm:text-right shrink-0">
                      {layman.storeImpact}
                    </span>
                  </div>

                  {/* Plain English 3-part layout */}
                  <div className="mt-3.5 space-y-2.5 text-xs">
                    {/* 1. What's wrong */}
                    <div className="rounded-lg bg-accent/40 p-3 border border-border/70">
                      <p className="font-semibold text-foreground flex items-center gap-1.5 mb-0.5">
                        <HelpCircle className="h-3.5 w-3.5 text-primary" /> What went wrong:
                      </p>
                      <p className="text-muted-foreground leading-relaxed pl-5">
                        {layman.whatWentWrong}
                      </p>
                    </div>

                    {/* 2. Why it matters (if not passed) */}
                    {!isPassed && (
                      <div className="rounded-lg bg-rose-500/5 p-3 border border-rose-200/50 dark:border-rose-900/30">
                        <p className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-0.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Why this matters:
                        </p>
                        <p className="text-rose-900/90 dark:text-rose-200 leading-relaxed pl-5">
                          {layman.whyItMatters}
                        </p>
                      </div>
                    )}

                    {/* 3. Action plan */}
                    {!isPassed && layman.actionSteps.length > 0 && (
                      <div className="rounded-lg bg-card p-3 border border-border">
                        <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Wrench className="h-3.5 w-3.5 text-primary" /> How to fix it:
                        </p>
                        <ol className="space-y-1 list-decimal list-inside pl-1.5 text-muted-foreground">
                          {layman.actionSteps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              <span className="text-foreground font-medium">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Collapsible Tech detail toggle */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleTech(finding.id)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Code2 className="h-3 w-3" />
                        {showTech ? "Hide code & manifest details" : "Show developer details"}
                      </button>
                    </div>

                    {showTech && (
                      <div className="rounded-md bg-muted p-2.5 font-mono text-[11px] text-foreground space-y-0.5">
                        <p><span className="text-muted-foreground">Rule:</span> {finding.title}</p>
                        <p><span className="text-muted-foreground">Detail:</span> {finding.detail}</p>
                        {finding.remediation && <p><span className="text-muted-foreground">Remediation:</span> {finding.remediation}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PM CHECKLIST */}
      {activeTab === "checklist" && (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Launch Sign-Off Checklist</CardTitle>
                <p className="text-xs text-muted-foreground">Verify these 4 areas before hitting submit in Google Play / App Store Connect.</p>
              </div>
              <span className="text-xs font-bold text-foreground bg-secondary px-2.5 py-1 rounded">
                {checklistDone} of {checklistTotal} Complete
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "legal", title: "1. Legal & Privacy Disclosures", desc: "Privacy policy webpage is live with third-party SDK disclosures." },
              { id: "permissions", title: "2. Sensitive Permission Justification", desc: "In-app popups explain why location, camera, or storage is needed." },
              { id: "qa", title: "3. QA Smoke & Regression Sign-Off", desc: "Core user flows and offline modes verified on real devices." },
              { id: "storeAssets", title: "4. Store Console Listings & Videos", desc: "Screenshots, release notes, and location justification videos uploaded." },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-3.5 rounded-lg border border-border bg-card hover:bg-accent/30 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={checkedSignOffs[item.id]}
                  onChange={() => toggleCheck(item.id)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-foreground">{item.title}</p>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: APP PERMISSIONS */}
      {activeTab === "permissions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Device features requested by <strong>{project.name}</strong></p>
            <p>Target SDK: {manifest?.targetSdkVersion ?? 34}</p>
          </div>

          {(manifest?.permissions || []).map((perm) => {
            const layman = explainPermissionInLayman(perm);
            return (
              <div key={perm.name} className="rounded-lg border border-border bg-card p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{layman.friendlyName}</span>
                    <Badge tone={perm.risk === "High" ? "danger" : perm.risk === "Medium" ? "warning" : "success"}>
                      {perm.risk} Risk
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{perm.name}</span>
                </div>
                <p className="text-xs text-foreground">{layman.plainMeaning}</p>
                <p className="text-[11px] text-muted-foreground"><strong>Store Rule:</strong> {layman.storePolicyNotes}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: PRIVACY POLICY */}
      {activeTab === "privacy" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Document: <strong>{privacyPolicy?.fileName || "Privacy Policy URL"}</strong></p>
          </div>

          {(privacyPolicy?.clauses || []).map((clause) => {
            const layman = explainPrivacyClauseInLayman(clause);
            return (
              <div key={clause.id} className="rounded-lg border border-border bg-card p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{layman.plainTitle}</span>
                  <Badge tone={clause.status === "Passed" ? "success" : "warning"}>{clause.status}</Badge>
                </div>
                <p className="text-xs text-foreground">{layman.plainMeaning}</p>
                <p className="text-[11px] text-primary"><strong>PM Note:</strong> {layman.pmTakeaway}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 5: QA TESTS */}
      {activeTab === "qa" && (
        <div className="space-y-2">
          {testCases.map((tc) => (
            <div key={tc.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${tc.status === "Passed" ? "text-emerald-600" : "text-amber-600"}`} />
                <span className="font-semibold text-foreground">{tc.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{tc.area}</span>
                <Badge tone={tc.status === "Passed" ? "success" : "warning"}>{tc.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Audit Sign-Off */}
      <div className="rounded-lg border border-border bg-card/60 p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p>ReleaseIQ Audit Engine · Evaluated for {project.name}</p>
        <p className="font-mono text-[11px]">Auditor: {user?.name || "Parth Gupta"}</p>
      </div>
    </div>
  );
}
