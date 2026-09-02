import { AlertTriangle, Trash2, X } from "lucide-react";
import type { Project } from "../types/release";
import { Button } from "./ui/Button";

export function DeleteProjectModal({
  isOpen,
  onClose,
  project,
  onConfirmDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirmDelete: (projectId: string) => void;
}) {
  if (!isOpen || !project) return null;

  const handleDelete = () => {
    onConfirmDelete(project.id);
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
        className="w-full max-w-md rounded-xl border border-rose-200 bg-card p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Delete Project Release Suite?</h3>
            <p className="text-xs text-muted-foreground leading-5">
              Are you sure you want to permanently delete <strong className="text-foreground">{project.name}</strong> ({project.packageId})?
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800 space-y-1">
          <p className="font-semibold">⚠️ This action cannot be undone.</p>
          <p className="text-[11px] leading-4 text-rose-700">
            All associated manifest analysis records, store compliance evaluations, custom policy rule evaluations, and QA test executions will be removed.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete Permanently
          </Button>
        </div>
      </div>
    </div>
  );
}
