import { Plus, Trash2, X, ListChecks } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Severity, TestCase } from "../types/release";
import { Button } from "./ui/Button";

export function NewTestCaseModal({
  isOpen,
  onClose,
  onAddTestCase,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddTestCase: (testCase: TestCase) => void;
}) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<TestCase["area"]>("Permissions");
  const [priority, setPriority] = useState<Severity>("High");
  const [preconditions, setPreconditions] = useState("");
  const [steps, setSteps] = useState<string[]>([
    "Launch application on targeted test device.",
    "Navigate to the affected feature flow and trigger user action.",
  ]);
  const [expectedResult, setExpectedResult] = useState("");

  if (!isOpen) return null;

  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };

  const addStep = () => {
    setSteps([...steps, ""]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTest: TestCase = {
      id: `tc-custom-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      area,
      priority,
      status: "Ready",
      preconditions: preconditions.trim() || undefined,
      steps: steps.filter((s) => s.trim().length > 0),
      expectedResult: expectedResult.trim() || "Feature behaves strictly per store policy.",
    };

    onAddTestCase(newTest);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ListChecks className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Create QA Validation Test Case</h3>
              <p className="text-xs text-muted-foreground">Add a custom verification procedure to this release suite</p>
            </div>
          </div>
          <Button type="button" variant="ghost" className="h-8 w-8 px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Test Case Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify location permission prompt displays required disclosures"
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Verification Area</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as any)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="Smoke">Smoke Test</option>
                <option value="Permissions">Permissions</option>
                <option value="Location">Location & Geofencing</option>
                <option value="Security">Security & Cryptography</option>
                <option value="Privacy">Privacy & Data Safety</option>
                <option value="Store Policy">Store Policy & In-App Purchase</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Priority Severity</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Severity)}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/25"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Preconditions (Optional)</label>
            <input
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              placeholder="e.g. App freshly installed with permissions revoked."
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-foreground">Test Execution Steps</label>
              <button
                type="button"
                onClick={addStep}
                className="text-primary font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Step
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground w-6 text-center">{idx + 1}.</span>
                  <input
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Action for step ${idx + 1}...`}
                    className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="p-1.5 text-muted-foreground hover:text-rose-600 transition"
                      title="Remove Step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Expected Outcome</label>
            <textarea
              required
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="Describe what successful compliance looks like..."
              className="w-full rounded-md border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Test Case</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
