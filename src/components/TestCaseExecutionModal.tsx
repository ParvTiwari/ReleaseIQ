import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  ListChecks,
  RotateCcw,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { TestCase } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

function toneForStatus(status: TestCase["status"]) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

export function TestCaseExecutionModal({
  isOpen,
  onClose,
  testCase,
  onUpdateTestCase,
  currentUserName = "QA Lead",
}: {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase | null;
  onUpdateTestCase: (updated: TestCase) => void;
  currentUserName?: string;
}) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [actualResult, setActualResult] = useState("");
  const [notes, setNotes] = useState("");
  const [successToast, setSuccessToast] = useState("");

  const steps = testCase?.steps && testCase.steps.length > 0
    ? testCase.steps
    : [
        "Launch application on targeted test device.",
        "Navigate to the affected feature flow and trigger user action.",
        "Observe system dialogs, network behavior, and store compliance prompts.",
      ];

  useEffect(() => {
    if (testCase) {
      setActualResult(testCase.actualResult || "");
      setNotes(testCase.notes || "");
      if (testCase.status === "Passed") {
        const allDone: Record<number, boolean> = {};
        steps.forEach((_, i) => (allDone[i] = true));
        setCompletedSteps(allDone);
      } else {
        setCompletedSteps({});
      }
    }
  }, [testCase]);

  if (!isOpen || !testCase) return null;

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleSaveStatus = (newStatus: TestCase["status"]) => {
    const updated: TestCase = {
      ...testCase,
      status: newStatus,
      actualResult: actualResult.trim() || testCase.expectedResult || "Verification completed successfully.",
      notes: notes.trim() || undefined,
      executedBy: currentUserName,
      executedAt: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }),
    };

    onUpdateTestCase(updated);
    setSuccessToast(`Test case marked as "${newStatus}"!`);
    setTimeout(() => {
      setSuccessToast("");
      onClose();
    }, 1100);
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
                QA Step Runner
              </span>
              <span className="text-xs text-muted-foreground font-mono">{testCase.id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-accent font-medium text-foreground">{testCase.area}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">{testCase.title}</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successToast && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Test Overview Bar */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 p-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Validation Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge tone={toneForStatus(testCase.status)}>{testCase.status}</Badge>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  testCase.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-accent text-muted-foreground"
                }`}>
                  {testCase.priority} Priority
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium">Last Executed By</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {testCase.executedBy ? `${testCase.executedBy} (${testCase.executedAt})` : "Not executed yet"}
              </p>
            </div>
          </div>

          {/* Preconditions */}
          {testCase.preconditions && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Preconditions</span>
              <div className="rounded-md border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
                {testCase.preconditions}
              </div>
            </div>
          )}

          {/* Step-by-Step Interactive Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground uppercase tracking-wider">
                Step-by-Step Test Procedure ({completedCount}/{steps.length})
              </span>
              <span className="font-semibold text-primary">{progressPercent}% complete</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {steps.map((step, idx) => {
                const isChecked = !!completedSteps[idx];
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                      isChecked
                        ? "border-emerald-300 bg-emerald-50/50 text-foreground"
                        : "border-border bg-card hover:bg-accent/40 text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`grid h-5 w-5 place-items-center rounded border mt-0.5 shrink-0 transition ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <span className="font-semibold text-foreground">Step {idx + 1}: </span>
                      <span>{step}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expected Result */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Expected Result</span>
            <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900 leading-5">
              {testCase.expectedResult || "System behaves in full compliance with store review specifications."}
            </div>
          </div>

          {/* Actual Result & QA Execution Notes */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Actual Result Observation
              </label>
              <textarea
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="Log actual observed behavior, UI response, or error messages..."
                className="w-full rounded-md border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/25"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                QA Notes / Failure Root Cause (Optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Verified on Pixel 8 (Android 14) build #204"
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 p-4">
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={() => handleSaveStatus("Ready")}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Ready
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSaveStatus("Blocked")}
              className="text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <ShieldAlert className="h-4 w-4 mr-1 text-rose-600" /> Fail / Blocker
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveStatus("Passed")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Pass Test Case
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
