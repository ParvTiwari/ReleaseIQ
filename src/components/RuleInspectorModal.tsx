import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  FileText,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { googlePlayComplianceRules, appleAppStoreComplianceRules } from "../data/complianceRules";
import type { ComplianceFinding, CustomPolicyRule, Project } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

export function RuleInspectorModal({
  isOpen,
  onClose,
  finding,
  isCustomPolicy = false,
  project,
  onToggleStatus,
}: {
  isOpen: boolean;
  onClose: () => void;
  finding?: ComplianceFinding | (CustomPolicyRule & { title?: string; detail?: string; owner?: string; remediation?: string });
  isCustomPolicy?: boolean;
  project: Project;
  onToggleStatus: (id: string) => void;
}) {
  const [exemptionNote, setExemptionNote] = useState("");
  const [isAddingExemption, setIsAddingExemption] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen || !finding) return null;

  const ruleTitle = "title" in finding && finding.title ? finding.title : "ruleName" in finding ? finding.ruleName : "Compliance Rule";
  const ruleDetail = "detail" in finding && finding.detail ? finding.detail : "description" in finding ? finding.description : "";
  const ruleCategory = "category" in finding && finding.category ? finding.category : "Governance";
  const ruleOwner = "owner" in finding && finding.owner ? finding.owner : isCustomPolicy ? "Security & Governance" : "Android / Legal";
  const ruleSeverity = finding.severity;
  const ruleStatus = finding.status;

  // Lookup matching rule definition from master catalog if applicable
  const masterRule =
    project.platform === "iOS"
      ? appleAppStoreComplianceRules.find((r) => r.title.toLowerCase() === ruleTitle.toLowerCase() || ruleTitle.toLowerCase().includes(r.category.toLowerCase()))
      : googlePlayComplianceRules.find((r) => r.title.toLowerCase() === ruleTitle.toLowerCase() || ruleTitle.toLowerCase().includes("location") && r.id.includes("location"));

  const officialDocUrl = masterRule?.docUrl || "https://support.google.com/googleplay/android-developer/answer/9934569";
  const guidelineRef = masterRule?.storeGuidelineRef || (isCustomPolicy ? "Corporate Governance & Security Baseline v3.1" : "Google Play Developer Policy");

  const handleResolve = () => {
    onToggleStatus(finding.id);
    setSuccessMessage(
      ruleStatus === "Passed"
        ? `Status toggled back to Warning/Blocked.`
        : `Check marked as Remediated! Project readiness score recalculated.`
    );
    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 1200);
  };

  const handleApplyExemption = () => {
    if (!exemptionNote.trim()) return;
    onToggleStatus(finding.id);
    setSuccessMessage(`Exemption recorded with sign-off: "${exemptionNote}"`);
    setTimeout(() => {
      setSuccessMessage("");
      setIsAddingExemption(false);
      setExemptionNote("");
      onClose();
    }, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border bg-muted/30 p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {isCustomPolicy ? "Custom Policy Inspector" : `${project.platform} Review Inspector`}
              </span>
              <span className="text-xs text-muted-foreground">{ruleCategory}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{ruleTitle}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Status & Severity Bar */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 p-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Evaluation Status</p>
              <div className="flex items-center gap-2">
                <Badge tone={toneForStatus(ruleStatus)}>{ruleStatus}</Badge>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  ruleSeverity === "High" ? "bg-rose-100 text-rose-700" : ruleSeverity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-accent text-muted-foreground"
                }`}>
                  {ruleSeverity} Severity
                </span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs text-muted-foreground font-medium">Assigned Owner</p>
              <p className="text-xs font-semibold text-foreground">{ruleOwner}</p>
            </div>
          </div>

          {/* Policy Guideline Reference */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground uppercase tracking-wider">Store Policy / Guideline Reference</span>
              <a
                href={officialDocUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Official Docs <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
              <p className="font-medium text-foreground mb-1">📜 {guidelineRef}</p>
              <p>{masterRule?.description || ruleDetail}</p>
            </div>
          </div>

          {/* Identified Issue & Code Evidence */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Identified Findings & Evidence</span>
            <div className="rounded-md border border-rose-200/80 bg-rose-50/40 p-3.5 space-y-2">
              <div className="flex items-start gap-2 text-xs text-rose-900 font-medium">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{ruleDetail}</span>
              </div>
              {ruleTitle.toLowerCase().includes("location") && (
                <div className="rounded bg-background p-2 font-mono text-[11px] text-muted-foreground border border-border flex items-center gap-2">
                  <FileCode2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>AndroidManifest.xml: &lt;uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/&gt;</span>
                </div>
              )}
            </div>
          </div>

          {/* Actionable Step-by-Step Remediation */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Actionable Remediation Guide</span>
            <div className="rounded-md border border-border bg-accent/40 p-3.5 text-xs text-foreground space-y-2">
              <p className="leading-5">
                {finding.remediation || masterRule?.remediationGuide || "Review the project artifacts, update code or declarations to satisfy the policy constraint, and click 'Mark as Remediated' to recalculate score."}
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11px]">
                <li>Verify runtime prompts and consent dialogs are displayed before accessing sensitive features.</li>
                <li>Submit clear user-facing justification in the developer store console.</li>
                <li>Verify build signatures and eliminate debug flags before submission.</li>
              </ul>
            </div>
          </div>

          {/* Exemption Request Drawer */}
          {isAddingExemption && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3.5 space-y-2">
              <p className="text-xs font-semibold text-amber-900">Record Reviewer Exemption / Sign-off Note</p>
              <textarea
                value={exemptionNote}
                onChange={(e) => setExemptionNote(e.target.value)}
                placeholder="State the business rationale or legal sign-off justification..."
                className="w-full rounded border border-amber-300 bg-background p-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/30"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsAddingExemption(false)}>Cancel</Button>
                <Button onClick={handleApplyExemption}>Approve Exemption</Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 p-4">
          <Button
            type="button"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => setIsAddingExemption(!isAddingExemption)}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            {isAddingExemption ? "Close Exemption" : "Request Legal Exemption"}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleResolve}
              className={ruleStatus === "Passed" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              {ruleStatus === "Passed" ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Re-open Blocker
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark as Remediated
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
