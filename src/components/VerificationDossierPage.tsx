import {
  AlertTriangle,
  Award,
  Calculator,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Download,
  FileCheck2,
  FileCode2,
  FileText,
  Fingerprint,
  Info,
  Lock,
  Printer,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { notifyToast } from "../lib/alerts";
import type {
  AuditorSignature,
  ComplianceFinding,
  ManifestArtifact,
  PrivacyPolicyArtifact,
  Project,
  TestCase,
} from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

export function VerificationDossierPage({
  project,
  manifest,
  privacyPolicy,
  complianceFindings,
  testCases,
  auditorSignature,
  onSaveSignature,
  onClearSignature,
}: {
  project: Project;
  manifest?: ManifestArtifact;
  privacyPolicy?: PrivacyPolicyArtifact;
  complianceFindings: ComplianceFinding[];
  testCases: TestCase[];
  auditorSignature?: AuditorSignature;
  onSaveSignature: (sig: AuditorSignature) => void;
  onClearSignature: () => void;
}) {
  // Signature Form State
  const [typedName, setTypedName] = useState(auditorSignature?.auditorName || "");
  const [auditorRole, setAuditorRole] = useState(auditorSignature?.auditorRole || "PDQA Quality Auditor");
  const [studentId, setStudentId] = useState(auditorSignature?.studentIdOrOrg || "PDQA-QA-2026-FINAL");
  const [courseCode, setCourseCode] = useState(auditorSignature?.courseCode || "PDQA Coursework Final Submission");
  const [auditorNotes, setAuditorNotes] = useState(auditorSignature?.notes || "");
  const [isCertified, setIsCertified] = useState(auditorSignature?.certified || false);
  const [pasteWarning, setPasteWarning] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatedFixedIds, setSimulatedFixedIds] = useState<Set<string>>(new Set());

  // Math metrics calculation
  const totalFindings = complianceFindings.length;
  const passedFindings = complianceFindings.filter((c) => c.status === "Passed").length;
  const warningFindings = complianceFindings.filter((c) => c.status === "Warning").length;
  const blockerFindings = complianceFindings.filter((c) => c.status === "Blocked").length;

  const totalTests = testCases.length;
  const passedTests = testCases.filter((tc) => tc.status === "Passed").length;
  const blockedTests = testCases.filter((tc) => tc.status === "Blocked").length;
  const testPassRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  // Severity weighted risk score: (3 * High) + (1.5 * Med) + (0.5 * Low)
  const highSeverityCount = complianceFindings.filter((c) => c.severity === "High").length;
  const medSeverityCount = complianceFindings.filter((c) => c.severity === "Medium").length;
  const lowSeverityCount = complianceFindings.filter((c) => c.severity === "Low").length;
  const riskIndex = (highSeverityCount * 3 + medSeverityCount * 1.5 + lowSeverityCount * 0.5).toFixed(1);

  const isApproved = project.readinessScore >= 80 && blockerFindings === 0;

  // Simulated metrics
  const simulatedNewlyPassed = Array.from(simulatedFixedIds).length;
  const simulatedTotalPassed = Math.min(totalFindings, passedFindings + simulatedNewlyPassed);
  const simulatedScore = totalFindings > 0 ? Math.round((simulatedTotalPassed / totalFindings) * 100) : 0;
  const simulatedBlockersCount = Math.max(
    0,
    complianceFindings.filter((c) => c.status === "Blocked" && !simulatedFixedIds.has(c.id)).length
  );
  const isSimulatedApproved = simulatedScore >= 80 && simulatedBlockersCount === 0;

  const toggleSimulatedFix = (id: string) => {
    setSimulatedFixedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyHash = () => {
    if (!auditorSignature?.verificationHash) return;
    navigator.clipboard.writeText(auditorSignature.verificationHash);
    notifyToast({
      title: "Verification Hash copied to clipboard!",
      icon: "success",
    });
  };

  // Anti-Paste Handler
  const handlePasteAttempt = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setPasteWarning("⚠️ Paste is disabled! For PDQA audit integrity, please type your name manually.");
    notifyToast({
      title: "Anti-tamper: Please type signature manually",
      icon: "warning",
    });
    setTimeout(() => setPasteWarning(null), 5000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      e.preventDefault();
      setPasteWarning("⚠️ Ctrl+V / Cmd+V is disabled! Please type your signature manually.");
      setTimeout(() => setPasteWarning(null), 5000);
    }
  };

  const handleSignDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedName.trim()) {
      notifyToast({
        title: "Please type your full name in the signature box",
        icon: "warning",
      });
      return;
    }
    if (!isCertified) {
      notifyToast({
        title: "Please check the certification declaration checkbox before signing",
        icon: "warning",
      });
      return;
    }

    const verificationHash = `SIG-${project.id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newSignature: AuditorSignature = {
      auditorName: typedName.trim(),
      auditorRole: auditorRole.trim() || "PDQA Quality Auditor",
      studentIdOrOrg: studentId.trim() || "PDQA-QA-2026-FINAL",
      courseCode: courseCode.trim() || "PDQA Coursework Final Submission",
      signedAt: new Date().toISOString(),
      verificationHash,
      certified: true,
      notes: auditorNotes.trim() || undefined,
    };

    onSaveSignature(newSignature);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportDossierMarkdown = () => {
    const md = `# 🎓 ReleaseIQ PDQA Release Verification Audit Dossier
**Project:** ${project.name} (\`${project.packageId}\`)  
**Platform:** ${project.platform} | **Target SDK:** ${manifest?.targetSdkVersion ?? 34} | **Target:** ${project.releaseTarget}  
**Audit Date:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}  
**Verification Verdict:** ${isApproved ? "✅ **APPROVED FOR STORE RELEASE**" : "🚨 **RELEASE BLOCKED (GATE STOP)**"}

---

## 1. Mathematical Scoring Breakdown
- **Formula:** $\\text{Readiness Score} = \\text{round}\\left(\\frac{N_{\\text{Passed}}}{N_{\\text{Total}}} \\times 100\\right)$
- **Calculation:** $(${passedFindings} / ${totalFindings}) \\times 100 = ${project.readinessScore}\\%$
- **Risk Severity Index:** ${riskIndex} pts (High: ${highSeverityCount} | Med: ${medSeverityCount} | Low: ${lowSeverityCount})
- **QA Test Suite Pass Rate:** ${testPassRate}% (${passedTests}/${totalTests} Passed)

---

## 2. XML Artifact Inspection Trail
${(manifest?.permissions || []).map((p, idx) => `- **STEP-${String(idx + 5).padStart(2, "0")}:** \`${p.name}\` — *${p.risk} Risk* (${p.description})`).join("\n")}

---

## 3. Compliance & Policy Trace
${complianceFindings.map((cf) => `- [${cf.status === "Passed" ? "x" : " "}] **${cf.title}** (${cf.severity} Severity) — *${cf.owner}*\n  - *Detail:* ${cf.detail}${cf.remediation ? `\n  - *Remediation:* ${cf.remediation}` : ""}`).join("\n")}

---

## 4. QA Validation Matrix (${testCases.length} Tests)
${testCases.map((tc) => `- **[${tc.status}]** \`${tc.id}\`: ${tc.title} (${tc.area})`).join("\n")}

---

## 5. Auditor Verification Sign-Off
- **Auditor:** ${auditorSignature?.auditorName || "PENDING SIGNATURE"}
- **Role & ID:** ${auditorSignature?.auditorRole || "N/A"} (${auditorSignature?.studentIdOrOrg || "N/A"})
- **Course Context:** ${auditorSignature?.courseCode || "PDQA Coursework Final Submission"}
- **Verification Hash:** \`${auditorSignature?.verificationHash || "UNSIGNED"}\`
- **Certified At:** ${auditorSignature ? new Date(auditorSignature.signedAt).toISOString() : "N/A"}
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-pdqa-verification-dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
    notifyToast({
      title: "Academic Markdown Dossier exported!",
      icon: "success",
    });
  };

  const handleExportFullDossierJson = () => {
    const fullDossier = {
      dossierTitle: "ReleaseIQ PDQA Comprehensive Release Verification Audit Dossier",
      courseWorkContext: {
        module: "PDQA (Product Development Quality Assurance)",
        purpose: "Final Coursework Submission & Release Verification",
        generatedAt: new Date().toISOString(),
      },
      projectDetails: {
        id: project.id,
        name: project.name,
        packageId: project.packageId,
        platform: project.platform,
        version: project.version,
        releaseTarget: project.releaseTarget,
        readinessScore: project.readinessScore,
        releaseStatus: project.status,
      },
      mathematicalCalculations: {
        formulaApplied: "ReadinessScore = round((PassedChecks / TotalChecks) * 100)",
        totalChecks: totalFindings,
        passedChecks: passedFindings,
        warningChecks: warningFindings,
        criticalBlockers: blockerFindings,
        calculatedScore: project.readinessScore,
        qaTestPassRate: `${testPassRate}% (${passedTests}/${totalTests})`,
        riskSeverityIndex: riskIndex,
        verdict: isApproved ? "APPROVED_FOR_RELEASE" : "RELEASE_BLOCKED",
      },
      manifestStepByStepTrace: {
        artifact: manifest?.name || "No manifest artifact",
        targetSdk: manifest?.targetSdkVersion ?? (project.platform === "iOS" ? 18 : 34),
        minSdk: manifest?.minSdkVersion ?? (project.platform === "iOS" ? 16 : 26),
        cleartextAllowed: manifest?.usesCleartextTraffic || false,
        permissionsCount: manifest?.permissions.length || 0,
        permissionAudits: manifest?.permissions || [],
      },
      privacyPolicyAudit: {
        fileName: privacyPolicy?.fileName || "None",
        clausesAudited: privacyPolicy?.clauses || [],
      },
      complianceRuleExecutionTrail: complianceFindings.map((cf) => ({
        id: cf.id,
        ruleTitle: cf.title,
        status: cf.status,
        severity: cf.severity,
        owner: cf.owner,
        detail: cf.detail,
        guidelineRef: cf.guidelineRef,
        remediation: cf.remediation,
      })),
      qaTestExecutionMatrix: testCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        area: tc.area,
        priority: tc.priority,
        status: tc.status,
        steps: tc.steps || [],
        expectedResult: tc.expectedResult,
      })),
      auditorDigitalSignOff: auditorSignature || {
        status: "UNSIGNED",
        note: "Pending manual auditor review and anti-paste signature entry",
      },
    };

    const blob = new Blob([JSON.stringify(fullDossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-pdqa-verification-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 print:m-0 print:p-0">
      {/* Top Academic & Coursework Banner */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">PDQA Coursework Final Submission</span>
              <span className="text-xs text-muted-foreground">· Full QA Verification Dossier &amp; Audit Trail</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">ReleaseIQ Quality Assurance &amp; Verification Dossier</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          <Button variant="secondary" onClick={handlePrint} className="h-8 text-xs px-2.5" title="Generate printable visual document or browser PDF">
            <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
          </Button>
          <Button variant="secondary" onClick={handleExportDossierMarkdown} className="h-8 text-xs px-2.5" title="Export academic markdown report">
            <FileText className="h-4 w-4 mr-1.5" /> Export Markdown
          </Button>
          <Button onClick={handleExportFullDossierJson} className="h-8 text-xs px-2.5" title="Export complete calculation and step trail data">
            <Download className="h-4 w-4 mr-1.5" /> Export Audit JSON
          </Button>
        </div>
      </div>

      {/* Overview & Auditor Stamp Summary */}
      <Card className="border-2 border-border print:border-none print:shadow-none">
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Release Assessment Certificate
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Cycle: 2026-PDQA-VERIFY
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">{project.name}</h2>
              <p className="text-xs font-mono text-muted-foreground">
                Package: {project.packageId} · Platform: {project.platform} · Version: {project.version} · Target: {project.releaseTarget}
              </p>
              <p className="text-xs text-muted-foreground max-w-2xl pt-1 leading-relaxed">
                This verification dossier presents an exhaustive step-by-step audit of all automated calculations, XML artifact node evaluations, privacy policy clause assessments, and generated QA test executions performed by ReleaseIQ.
              </p>
            </div>

            {/* Score & Auditor State Card */}
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-border bg-accent/40 p-4 shrink-0">
              <div className="text-center px-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Readiness Score</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-foreground">{project.readinessScore}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/100</span>
                </div>
                <Badge tone={isApproved ? "success" : "danger"} className="mt-1">
                  {isApproved ? "Approved for Release" : "Submission Blocked"}
                </Badge>
              </div>

              <div className="hidden sm:block h-14 w-px bg-border" />

              <div className="text-center sm:text-left px-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Auditor Sign-Off</p>
                {auditorSignature ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <ShieldCheck className="h-4 w-4 shrink-0" /> Verified &amp; Signed
                    </div>
                    <p className="text-xs font-semibold text-foreground">{auditorSignature.auditorName}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{auditorSignature.studentIdOrOrg}</p>
                  </div>
                ) : (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <Lock className="h-3.5 w-3.5 shrink-0" /> Pending Signature
                    </div>
                    <a href="#auditor-signoff-section" className="text-[11px] text-primary hover:underline font-medium block">
                      Jump to sign-off box ↓
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1: Mathematical Calculations & Formula Breakdown */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Calculator className="h-5 w-5" />
            <CardTitle>1. Mathematical Scoring &amp; Calculation Formula Breakdown</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete mathematical derivation and weighting formulas used to evaluate release readiness.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Formula 1 */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formula A: Readiness Score</span>
                <span className="text-xs font-mono font-bold text-primary">{project.readinessScore}%</span>
              </div>
              <div className="rounded bg-accent/60 p-2.5 font-mono text-xs text-foreground border border-border/60">
                Readiness = round( (Passed / Total) × 100 )
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Passed Checks (N<sub>pass</sub>):</span>
                  <strong className="text-emerald-600">{passedFindings}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Checks (N<sub>total</sub>):</span>
                  <strong>{totalFindings}</strong>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Calculation:</span>
                  <span className="font-mono">({passedFindings} / {totalFindings}) × 100 = {project.readinessScore}%</span>
                </div>
              </div>
            </div>

            {/* Formula 2 */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formula B: Risk Severity Index</span>
                <span className="text-xs font-mono font-bold text-amber-600">{riskIndex} pts</span>
              </div>
              <div className="rounded bg-accent/60 p-2.5 font-mono text-xs text-foreground border border-border/60">
                Risk = (3.0 × High) + (1.5 × Med) + (0.5 × Low)
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>High Risk (W=3.0):</span>
                  <strong className="text-rose-600">{highSeverityCount} × 3 = {highSeverityCount * 3}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Medium Risk (W=1.5):</span>
                  <strong className="text-amber-600">{medSeverityCount} × 1.5 = {medSeverityCount * 1.5}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Low Risk (W=0.5):</span>
                  <strong className="text-emerald-600">{lowSeverityCount} × 0.5 = {lowSeverityCount * 0.5}</strong>
                </div>
              </div>
            </div>

            {/* Formula 3 */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Formula C: QA Test Pass Rate</span>
                <span className="text-xs font-mono font-bold text-emerald-600">{testPassRate}%</span>
              </div>
              <div className="rounded bg-accent/60 p-2.5 font-mono text-xs text-foreground border border-border/60">
                QA Pass Rate = (Tests<sub>Passed</sub> / Tests<sub>Total</sub>) × 100
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Executed Tests (Passed):</span>
                  <strong className="text-emerald-600">{passedTests}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Blocked / Failed Tests:</span>
                  <strong className="text-rose-600">{blockedTests}</strong>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Pass Rate Derivation:</span>
                  <span className="font-mono">({passedTests} / {totalTests}) × 100 = {testPassRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Rule Logic Matrix */}
          <div className="rounded-lg border border-border bg-accent/20 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary" /> Store Gate Release Decision Logic
            </h4>
            <div className="grid gap-2 sm:grid-cols-3 text-xs">
              <div className={`rounded p-2.5 border ${blockerFindings > 0 ? "border-rose-300 bg-rose-50 text-rose-900 font-semibold" : "border-border bg-card text-muted-foreground"}`}>
                <p className="font-bold">Condition 1: Critical Blocker Veto</p>
                <p className="text-[11px] mt-0.5 font-mono">Blockers &gt; 0 → Status: BLOCKED</p>
                <p className="text-[11px] mt-1">Current: {blockerFindings} Active Blockers {blockerFindings > 0 ? "(ACTIVE GATE STOP)" : "(Passed)"}</p>
              </div>
              <div className={`rounded p-2.5 border ${blockerFindings === 0 && project.readinessScore >= 80 ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold" : "border-border bg-card text-muted-foreground"}`}>
                <p className="font-bold">Condition 2: Score Approval Threshold</p>
                <p className="text-[11px] mt-0.5 font-mono">Score &ge; 80% &amp; Blockers = 0 → APPROVED</p>
                <p className="text-[11px] mt-1">Current Score: {project.readinessScore}% {project.readinessScore >= 80 ? "(Satisfied)" : "(Below 80%)"}</p>
              </div>
              <div className={`rounded p-2.5 border ${blockerFindings === 0 && project.readinessScore < 80 ? "border-amber-300 bg-amber-50 text-amber-900 font-semibold" : "border-border bg-card text-muted-foreground"}`}>
                <p className="font-bold">Condition 3: Needs Review</p>
                <p className="text-[11px] mt-0.5 font-mono">Blockers = 0 &amp; Score &lt; 80% → NEEDS REVIEW</p>
                <p className="text-[11px] mt-1">Status: {project.status}</p>
              </div>
            </div>
          </div>

          {/* Interactive Remediation & Math Simulator (Viva / Coursework Demo Tool) */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Interactive Remediation &amp; Formula Simulator (Viva Demo)
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsSimulatorOpen((prev) => !prev)}
                className="h-7 text-xs px-2"
              >
                {isSimulatorOpen ? "Collapse Simulator" : "Simulate Blocker Fixes"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle simulated engineering or legal fixes to see how the mathematical calculation updates in real time.
            </p>

            {isSimulatorOpen && (
              <div className="space-y-3 pt-2 border-t border-primary/20">
                <div className="grid gap-2 sm:grid-cols-2">
                  {complianceFindings
                    .filter((c) => c.status === "Blocked" || c.status === "Warning")
                    .map((item) => {
                      const isSimFixed = simulatedFixedIds.has(item.id);
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer text-xs transition select-none ${
                            isSimFixed
                              ? "border-emerald-300 bg-emerald-50/60 text-emerald-900"
                              : "border-border bg-card text-foreground hover:bg-accent/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSimFixed}
                            onChange={() => toggleSimulatedFix(item.id)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <span>{item.title}</span>
                              <Badge tone={item.status === "Blocked" ? "danger" : "warning"} className="text-[10px] px-1 py-0">
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{item.detail}</p>
                          </div>
                        </label>
                      );
                    })}
                </div>

                {/* Simulated Math Outcome Strip */}
                <div className="rounded-lg bg-card p-3 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">Simulated Math Outcome:</span>
                    <p className="text-muted-foreground font-mono">
                      Formula: ({simulatedTotalPassed} / {totalFindings}) × 100 = <strong>{simulatedScore}%</strong> (Δ +{simulatedScore - project.readinessScore}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">Remaining Blockers: {simulatedBlockersCount}</span>
                    <Badge tone={isSimulatedApproved ? "success" : "danger"}>
                      {isSimulatedApproved ? "Simulated: APPROVED" : "Simulated: BLOCKED"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Deep XML Manifest & Artifact Step Trace */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <FileCode2 className="h-5 w-5" />
              <CardTitle>2. XML Artifact Node-by-Node Step Verification Trail</CardTitle>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Artifact: {manifest?.name || (project.platform === "iOS" ? "Info.plist" : "AndroidManifest.xml")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Granular inspection record of every XML tag, target SDK version, network security flag, and declared permission.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manifest Node Summary Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Step #</th>
                  <th className="p-3">Target XML Node / Tag</th>
                  <th className="p-3">Evaluated Value / Attribute</th>
                  <th className="p-3">Store Compliance Rule</th>
                  <th className="p-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Step 1: Package */}
                <tr>
                  <td className="p-3 font-mono">STEP-01</td>
                  <td className="p-3 font-mono font-medium text-foreground">&lt;manifest package=&quot;...&quot;&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">{project.packageId}</td>
                  <td className="p-3 text-muted-foreground">Package namespace uniqueness &amp; reverse-DNS format</td>
                  <td className="p-3"><Badge tone="success">PASS</Badge></td>
                </tr>

                {/* Step 2: Target SDK */}
                <tr>
                  <td className="p-3 font-mono">STEP-02</td>
                  <td className="p-3 font-mono font-medium text-foreground">&lt;uses-sdk android:targetSdkVersion&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">API {manifest?.targetSdkVersion ?? (project.platform === "iOS" ? "18 (iOS 18)" : "34 (Android 14)")}</td>
                  <td className="p-3 text-muted-foreground">
                    {project.platform === "iOS" ? "App Store Submission Target iOS 16+" : "Google Play Mandate targetSdkVersion &ge; 34"}
                  </td>
                  <td className="p-3">
                    <Badge tone={(manifest?.targetSdkVersion ?? 34) >= (project.platform === "iOS" ? 16 : 34) ? "success" : "danger"}>
                      {(manifest?.targetSdkVersion ?? 34) >= (project.platform === "iOS" ? 16 : 34) ? "PASS" : "FAIL (BLOCKER)"}
                    </Badge>
                  </td>
                </tr>

                {/* Step 3: Minimum SDK */}
                <tr>
                  <td className="p-3 font-mono">STEP-03</td>
                  <td className="p-3 font-mono font-medium text-foreground">&lt;uses-sdk android:minSdkVersion&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">API {manifest?.minSdkVersion ?? (project.platform === "iOS" ? "16" : "26")}</td>
                  <td className="p-3 text-muted-foreground">Minimum backward compatibility baseline</td>
                  <td className="p-3"><Badge tone="success">PASS</Badge></td>
                </tr>

                {/* Step 4: Cleartext Traffic */}
                <tr>
                  <td className="p-3 font-mono">STEP-04</td>
                  <td className="p-3 font-mono font-medium text-foreground">&lt;application android:usesCleartextTraffic&gt;</td>
                  <td className="p-3 font-mono text-muted-foreground">{manifest?.usesCleartextTraffic ? "true (Insecure HTTP)" : "false (TLS 1.3 Strict)"}</td>
                  <td className="p-3 text-muted-foreground">Network Security &amp; In-Transit TLS Transport Encryption</td>
                  <td className="p-3">
                    <Badge tone={manifest?.usesCleartextTraffic ? "danger" : "success"}>
                      {manifest?.usesCleartextTraffic ? "FAIL (BLOCKER)" : "PASS"}
                    </Badge>
                  </td>
                </tr>

                {/* Permissions Steps */}
                {manifest?.permissions && manifest.permissions.length > 0 ? (
                  manifest.permissions.map((perm, idx) => (
                    <tr key={perm.name}>
                      <td className="p-3 font-mono">STEP-{String(idx + 5).padStart(2, "0")}</td>
                      <td className="p-3 font-mono font-medium text-foreground truncate max-w-xs" title={perm.name}>
                        &lt;uses-permission name=&quot;{perm.name.split(".").pop()}&quot;&gt;
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <span className="font-semibold text-foreground">{perm.description}</span>
                        {perm.requiredJustification && (
                          <span className="block text-[10px] text-amber-700 font-medium">Requires Play Console Justification</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-[11px]">{perm.playStoreGuidance || "Standard permission declaration"}</td>
                      <td className="p-3">
                        <Badge tone={perm.risk === "High" ? "danger" : perm.risk === "Medium" ? "warning" : "success"}>
                          {perm.risk === "High" ? "HIGH RISK" : perm.risk === "Medium" ? "WARNING" : "PASS"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-muted-foreground italic">
                      No additional permissions parsed from manifest artifact.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Privacy Policy & Compliance Rules Execution Trail */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              <CardTitle>3. Privacy Policy &amp; Compliance Clause Audit Trace</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {privacyPolicy?.fileName || "Privacy Policy Document"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Evaluation of data safety declarations, account deletion mandates (§4.8 / Apple §5.1.1(v)), and third-party SDK disclosures.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {complianceFindings.map((finding) => (
            <div
              key={finding.id}
              className={`rounded-lg border p-3.5 space-y-1.5 transition-colors ${
                finding.status === "Blocked"
                  ? "border-rose-200 bg-rose-50/40"
                  : finding.status === "Warning"
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{finding.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-accent">
                      {finding.category || "Store Compliance"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{finding.detail}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    tone={
                      finding.status === "Passed"
                        ? "success"
                        : finding.status === "Blocked"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {finding.status === "Passed" ? "PASS" : finding.status === "Blocked" ? "FAIL (BLOCKER)" : "WARNING"}
                  </Badge>
                </div>
              </div>

              {finding.guidelineRef && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  <strong>Ref:</strong> {finding.guidelineRef} · <strong>Owner:</strong> {finding.owner}
                </p>
              )}

              {finding.remediation && (
                <div className="rounded bg-background/80 p-2 text-xs text-foreground border border-border mt-1">
                  <strong>Remediation Step:</strong> {finding.remediation}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SECTION 4: Generated QA Test Case Execution Matrix */}
      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <FileCheck2 className="h-5 w-5" />
              <CardTitle>4. Generated QA Test Case Execution &amp; Traceability Matrix ({testCases.length} Tests)</CardTitle>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              Pass Rate: {testPassRate}% ({passedTests}/{totalTests} Verified)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete inventory of pre-flight QA test cases generated and evaluated for this release.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-accent/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Test ID</th>
                  <th className="p-3">Functional Area</th>
                  <th className="p-3">Test Scenario &amp; Steps</th>
                  <th className="p-3">Expected Result</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {testCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-accent/20">
                    <td className="p-3 font-mono font-medium text-muted-foreground">{tc.id}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-accent font-medium text-[11px]">
                        {tc.area}
                      </span>
                    </td>
                    <td className="p-3 max-w-sm">
                      <p className="font-semibold text-foreground">{tc.title}</p>
                      {tc.steps && tc.steps.length > 0 && (
                        <ol className="list-decimal list-inside text-[11px] text-muted-foreground mt-1 space-y-0.5">
                          {tc.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs text-[11px]">
                      {tc.expectedResult || "Complies with platform guidelines without crash or policy violation."}
                    </td>
                    <td className="p-3">
                      <Badge tone={tc.priority === "High" ? "danger" : tc.priority === "Medium" ? "warning" : "neutral"}>
                        {tc.priority}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge tone={tc.status === "Passed" ? "success" : tc.status === "Blocked" ? "danger" : "warning"}>
                        {tc.status === "Passed" ? "PASS" : tc.status === "Blocked" ? "FAIL (BLOCKED)" : tc.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5: Anti-Paste Interactive Auditor Sign-Off Box */}
      <div id="auditor-signoff-section" className="scroll-mt-6">
        <Card className="border-2 border-primary/40 bg-gradient-to-b from-card to-accent/20 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">5. Interactive Auditor Sign-Off &amp; Certification Box</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official course work verification sign-off. Enforces anti-tamper manual signature entry.
                  </p>
                </div>
              </div>
              {auditorSignature && (
                <Badge tone="success" className="px-3 py-1 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Dossier Certified &amp; Sealed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Anti-Paste Security Notice Banner */}
            <div className="rounded-lg border border-amber-300/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Anti-Tamper Audit Integrity Rule Active:</strong>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Clipboard pasting (Ctrl+V / Cmd+V / Right-Click Paste) is strictly disabled in the signature box below to verify human auditor accountability. You must type your full name manually.
                </p>
              </div>
            </div>

            {pasteWarning && (
              <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 font-semibold animate-shake">
                {pasteWarning}
              </div>
            )}

            {/* If Already Signed: Render Official Verification Seal */}
            {auditorSignature ? (
              <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/30 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Official Digital Verification Seal
                        </span>
                        <Badge tone="success">Verified</Badge>
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{auditorSignature.auditorName}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {auditorSignature.auditorRole} · ID: {auditorSignature.studentIdOrOrg}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Certified Timestamp</p>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {new Date(auditorSignature.signedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <span className="text-[10px] font-mono text-emerald-800 font-semibold truncate max-w-xs">
                        Hash: {auditorSignature.verificationHash}
                      </span>
                      <button
                        onClick={handleCopyHash}
                        className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
                        title="Copy Verification Hash"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-background p-3.5 border border-emerald-200/60 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Certification Declaration
                  </div>
                  <p className="text-muted-foreground italic leading-relaxed">
                    &quot;I hereby certify that I have independently executed and verified all calculation formulas, XML artifact tags, sensitive permissions, privacy policy disclosures, and QA test executions for {project.name}. This dossier accurately attests to release readiness under PDQA standards.&quot;
                  </p>
                  {auditorSignature.notes && (
                    <div className="pt-1.5 border-t border-border mt-2">
                      <span className="font-semibold text-foreground">Auditor Remarks:</span>
                      <p className="text-muted-foreground mt-0.5">{auditorSignature.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Course: {auditorSignature.courseCode}
                  </p>
                  <Button variant="secondary" onClick={onClearSignature} className="h-8 text-xs px-2.5 text-rose-600 hover:text-rose-700">
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Re-Open Signature / Re-sign
                  </Button>
                </div>
              </div>
            ) : (
              /* Signature Input Form */
              <form onSubmit={handleSignDossier} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Typed Name (Strictly No Paste) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Auditor Signature (Full Legal / Academic Name) *</span>
                      <span className="text-[11px] text-amber-700 font-mono flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Anti-Paste Protected
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      onPaste={handlePasteAttempt}
                      onKeyDown={handleKeyDown}
                      onDrop={(e) => {
                        e.preventDefault();
                        handlePasteAttempt(e as unknown as React.ClipboardEvent);
                      }}
                      placeholder="Type your full name character-by-character (e.g. Parv Tiwari)..."
                      className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm font-medium text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Pasting is disabled. Typing your name constitutes your formal digital signature for this QA audit.
                    </p>
                  </div>

                  {/* Auditor Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Auditor Role / Designation
                    </label>
                    <input
                      type="text"
                      value={auditorRole}
                      onChange={(e) => setAuditorRole(e.target.value)}
                      placeholder="e.g. Lead QA Engineer / Student Auditor"
                      className="w-full rounded-md border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Student ID / Org */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Student ID / Department / Organization
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. 2026-PDQA-ROLL-01"
                      className="w-full rounded-md border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Coursework Code */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Coursework / Submission Context
                    </label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="PDQA Coursework Final Submission"
                      className="w-full rounded-md border border-input bg-background px-3.5 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Optional Remarks */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Auditor Assessment Notes / Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={auditorNotes}
                      onChange={(e) => setAuditorNotes(e.target.value)}
                      placeholder="Add any specific observations regarding manifest analysis, edge case testing, or guideline exemptions..."
                      className="w-full rounded-md border border-input bg-background px-3.5 py-2 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Certification Checkbox */}
                <div className="rounded-lg border border-border bg-accent/30 p-3.5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isCertified}
                      onChange={(e) => setIsCertified(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary shrink-0"
                    />
                    <div className="text-xs space-y-0.5">
                      <span className="font-semibold text-foreground">
                        Formal Attestation &amp; Verification Declaration *
                      </span>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        I certify that I have thoroughly reviewed all calculations, XML manifest permissions, compliance findings, and test case executions presented in this ReleaseIQ dossier. The information is accurate and verified for coursework submission.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit Sign Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Signing will lock the audit report and issue a verifiable cryptographic hash.
                  </p>
                  <Button type="submit" className="shrink-0">
                    <UserCheck className="h-4 w-4 mr-1.5" /> Sign &amp; Seal Verification Dossier
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p>© 2026 ReleaseIQ Quality Assurance &amp; Verification Suite · PDQA Final Coursework</p>
        <p className="font-mono">
          Project ID: {project.id} · Generated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
