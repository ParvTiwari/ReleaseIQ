import {
  Apple,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  FileCode,
  FileCode2,
  FileText,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { SampleArtifactInfo } from "../data/sampleArtifacts";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface SampleFilePreviewModalProps {
  sample: SampleArtifactInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onPutToAnalysis: (sample: SampleArtifactInfo) => Promise<void> | void;
}

interface AnalysisStep {
  id: number;
  name: string;
  description: string;
  durationMs: number;
  logDetailAndroid: string;
  logDetailIos: string;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 1,
    name: "Schema & AST Structure Validation",
    description: "Parsing XML and property list node tree, validating namespace declarations.",
    durationMs: 550,
    logDetailAndroid: "Validated manifest schema, package name, and SDK targets.",
    logDetailIos: "Validated CFBundle dictionary hierarchy and MinimumOSVersion.",
  },
  {
    id: 2,
    name: "Permission & Hardware Capability Extraction",
    description: "Extracting runtime permissions, purpose strings, and background execution modes.",
    durationMs: 650,
    logDetailAndroid: "Extracted 6 permissions including location, camera, and sensor access.",
    logDetailIos: "Extracted 6 purpose strings including ATT tracking and HealthKit keys.",
  },
  {
    id: 3,
    name: "Store Policy & Guideline Verification",
    description: "Evaluating compliance against Google Play and Apple App Store review rules.",
    durationMs: 700,
    logDetailAndroid: "Verified target SDK 34 mandate, TLS transport, and automotive descriptors.",
    logDetailIos: "Verified App Store Guideline 5.1.1 purpose strings and ATS encryption.",
  },
  {
    id: 4,
    name: "QA Test Suite & Readiness Scoring",
    description: "Compiling automated verification test cases and calculating release readiness score.",
    durationMs: 600,
    logDetailAndroid: "Generated test cases for permission fallback. Readiness: 82/100.",
    logDetailIos: "Generated test cases for ATT prompt and StoreKit. Readiness: 84/100.",
  },
];

export function SampleFilePreviewModal({
  sample,
  isOpen,
  onClose,
  onPutToAnalysis,
}: SampleFilePreviewModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [analysisFinished, setAnalysisFinished] = useState(false);

  // Reset state when opening a new sample
  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(false);
      setActiveStepIndex(0);
      setCompletedSteps([]);
      setAnalysisFinished(false);
      setIsCopied(false);
    }
  }, [isOpen, sample?.id]);

  // Run the 4-step animation sequence
  useEffect(() => {
    if (!isAnalyzing || analysisFinished) return;

    const currentStep = ANALYSIS_STEPS[activeStepIndex];
    if (!currentStep) return;

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, currentStep.id]);

      if (activeStepIndex < ANALYSIS_STEPS.length - 1) {
        setActiveStepIndex((prev) => prev + 1);
      } else {
        setAnalysisFinished(true);
      }
    }, currentStep.durationMs);

    return () => clearTimeout(timer);
  }, [isAnalyzing, activeStepIndex, analysisFinished]);

  if (!isOpen || !sample) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sample.rawContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setAnalysisFinished(false);
  };

  const handleCompleteAndProceed = async () => {
    await onPutToAnalysis(sample);
  };

  const lines = sample.rawContent.trim().split("\n");
  const isIos = sample.platform === "iOS";
  const progressPercent = analysisFinished
    ? 100
    : Math.round(((completedSteps.length + (isAnalyzing ? 0.35 : 0)) / ANALYSIS_STEPS.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border border-slate-700/80 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                isIos
                  ? "border-sky-500/30 bg-sky-950/50 text-sky-400"
                  : "border-emerald-500/30 bg-emerald-950/50 text-emerald-400"
              }`}
            >
              {isIos ? <Apple className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{sample.title}</h3>
                <Badge tone={isIos ? "neutral" : "success"} className="text-xs">
                  {sample.badge}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                <span>{sample.fileName}</span>
                <span>/</span>
                <span>{lines.length} lines</span>
                <span>/</span>
                <span>Target: {sample.targetSdkOrDeployment}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar across top of body if analyzing */}
        {isAnalyzing && (
          <div className="h-1 w-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-sky-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* View Mode 1: 4-Step Animated Analysis View */}
        {isAnalyzing ? (
          <div className="flex flex-col flex-1 overflow-y-auto p-6 bg-slate-950 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Release Readiness Engine
                </p>
                <h4 className="text-lg font-bold text-white mt-0.5">
                  {analysisFinished ? "Analysis Pipeline Completed" : "Executing Automated Compliance Pipeline"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluating {sample.fileName} against {isIos ? "Apple App Store Review Guidelines" : "Google Play Store Submission Policies"}.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400">Progress:</span>
                <span className="font-mono text-sm font-bold text-sky-400">{progressPercent}%</span>
              </div>
            </div>

            {/* 4 Steps Tracker */}
            <div className="space-y-3">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isCompleted = completedSteps.includes(step.id);
                const isRunning = isAnalyzing && !analysisFinished && activeStepIndex === idx;
                const isPending = !isCompleted && !isRunning;

                return (
                  <div
                    key={step.id}
                    className={`rounded-lg border p-4 transition-all duration-200 ${
                      isRunning
                        ? "border-sky-500/50 bg-sky-950/30 shadow-inner"
                        : isCompleted
                        ? "border-slate-800 bg-slate-900/60"
                        : "border-slate-800/60 bg-slate-900/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          ) : isRunning ? (
                            <Loader2 className="h-5 w-5 text-sky-400 animate-spin shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-600 shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-slate-500">
                              0{step.id}
                            </span>
                            <span className="text-sm font-semibold text-slate-200">
                              {step.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {step.description}
                          </p>

                          {/* Live detail log when running or completed */}
                          {(isRunning || isCompleted) && (
                            <div className="mt-2 flex items-center gap-2 rounded bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-slate-800">
                              <Terminal className="h-3 w-3 text-slate-500 shrink-0" />
                              <span>{isIos ? step.logDetailIos : step.logDetailAndroid}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isCompleted ? (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                            Passed
                          </span>
                        ) : isRunning ? (
                          <span className="text-[11px] font-mono text-sky-400 animate-pulse">
                            Processing...
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-600">
                            Queued
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion Summary Card */}
            {analysisFinished && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">Evaluation Successfully Assembled</h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Extracted {isIos ? "6 purpose keys and transport policies" : "6 permissions and target SDK 34"}. Ready to apply to project.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleCompleteAndProceed}
                    className="shrink-0 font-medium px-5"
                  >
                    View Analysis in Project
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: Standard Code Preview */
          <>
            {/* Highlights Bar */}
            <div className="border-b border-slate-800 bg-slate-950/60 px-6 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span>Audit checkpoints in this artifact:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sample.keyHighlights.map((hl, idx) => {
                    const tone =
                      hl.tone === "danger"
                        ? "danger"
                        : hl.tone === "warning"
                        ? "warning"
                        : hl.tone === "success"
                        ? "success"
                        : "neutral";
                    return (
                      <Badge key={idx} tone={tone} className="text-[11px] py-0.5 px-2">
                        {hl.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Code Body */}
            <div className="relative flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs text-slate-300">
              <div className="absolute right-6 top-6 z-10">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-sans font-medium text-slate-300 shadow-md backdrop-blur hover:bg-slate-800 hover:text-white transition-all"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-0.5 select-text">
                {lines.map((line, idx) => {
                  const isComment = line.trim().startsWith("<!--") || line.trim().endsWith("-->");
                  const isKey = line.includes("<key>") || line.includes("android:name=");
                  const isDangerKey =
                    line.includes("ACCESS_BACKGROUND_LOCATION") ||
                    line.includes("NSAllowsArbitraryLoads") ||
                    line.includes("MANAGE_EXTERNAL_STORAGE");

                  return (
                    <div
                      key={idx}
                      className={`flex py-0.5 px-2 rounded font-mono ${
                        isDangerKey
                          ? "bg-rose-950/30 text-rose-200 border-l-2 border-rose-500"
                          : "hover:bg-slate-900/60"
                      }`}
                    >
                      <span className="w-9 shrink-0 text-slate-600 select-none text-right pr-3">
                        {idx + 1}
                      </span>
                      <span
                        className={
                          isComment
                            ? "text-slate-500 italic"
                            : isDangerKey
                            ? "text-rose-300 font-semibold"
                            : isKey
                            ? "text-sky-300"
                            : "text-slate-300"
                        }
                      >
                        {line}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCode2 className="h-4 w-4 text-slate-400" />
            <span>
              {isAnalyzing
                ? "Simulating static analysis and rule validation sequence."
                : "Loads sample file directly into active analysis."}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isAnalyzing && !analysisFinished}>
              {analysisFinished ? "Close" : "Dismiss"}
            </Button>

            {!isAnalyzing ? (
              <Button
                variant="primary"
                onClick={startAnalysis}
                className="font-medium px-5"
              >
                Put to Analysis Now
              </Button>
            ) : analysisFinished ? (
              <Button
                variant="primary"
                onClick={handleCompleteAndProceed}
                className="font-medium px-5"
              >
                Apply to Project
              </Button>
            ) : (
              <Button variant="secondary" disabled className="gap-2 px-5">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Running Step 0{activeStepIndex + 1}...</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
