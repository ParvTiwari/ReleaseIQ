import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Info,
  Plus,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRelease } from "../context/ReleaseContext";
import { notifyToast } from "../lib/alerts";
import type { HistoryItem, Project } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

export function HistoryPage({
  project,
}: {
  project: Project;
}) {
  const { activeHistory, handleAddHistoryItem } = useRelease();
  const [query, setQuery] = useState("");
  const [filterPerson, setFilterPerson] = useState<string>("All");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [newEvent, setNewEvent] = useState({
    event: "",
    person: "Parv Tiwari (Auditor)",
    detail: "",
  });

  const filteredEvents = useMemo(() => {
    return activeHistory.filter((e) => {
      const matchPerson = filterPerson === "All" || e.person.toLowerCase().includes(filterPerson.toLowerCase());
      const matchQuery = `${e.event} ${e.detail} ${e.person}`.toLowerCase().includes(query.toLowerCase());
      return matchPerson && matchQuery;
    });
  }, [activeHistory, query, filterPerson]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.event.trim() || !newEvent.detail.trim()) return;

    const logged: HistoryItem = {
      event: newEvent.event.trim(),
      person: newEvent.person,
      time: "Just now",
      detail: newEvent.detail.trim(),
    };

    handleAddHistoryItem(logged);
    setNewEvent({ event: "", person: "Parv Tiwari (Auditor)", detail: "" });
    setIsLogModalOpen(false);
    notifyToast({
      title: "Audit event recorded to release history",
      icon: "success",
    });
  };

  const handleExportHistory = () => {
    const jsonStr = JSON.stringify(activeHistory, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-audit-trail.json`;
    a.click();
    notifyToast({
      title: "Audit history log exported as JSON",
      icon: "success",
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Compliance Governance</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">Release Audit History & Timeline</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Immutable chronological record of uploads, QA executions, and compliance sign-offs for <strong className="text-foreground">{project.name}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportHistory}>
            <Download className="h-4 w-4 mr-1.5" /> Export Audit Log
          </Button>
          <Button onClick={() => setIsLogModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Log Auditor Event
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-md text-xs">
          {(["All", "Automated", "Parv", "QA", "CI/CD"] as const).map((person) => (
            <button
              type="button"
              key={person}
              onClick={() => setFilterPerson(person)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filterPerson === person ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {person === "All" ? "All Actors" : person}
            </button>
          ))}
        </div>

        <label className="flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs w-full sm:w-72">
          <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full bg-transparent outline-none text-xs placeholder:text-muted-foreground"
          />
        </label>
      </div>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Release Audit Timeline ({filteredEvents.length} Events)</CardTitle>
            <span className="text-xs text-muted-foreground">SHA-256 integrity verified</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="relative border-l-2 border-border ml-4 pl-6 space-y-6">
            {filteredEvents.map((item, idx) => (
              <div key={`${item.event}-${idx}`} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>

                <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition shadow-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="font-bold text-sm text-foreground">{item.event}</p>
                    <span className="text-[11px] text-muted-foreground font-mono">{item.time}</span>
                  </div>

                  <p className="text-xs leading-5 text-muted-foreground">{item.detail}</p>

                  <div className="flex items-center gap-2 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                    <User className="h-3 w-3 text-primary" />
                    <span>Actor: <strong className="text-foreground">{item.person}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No audit records match the selected filter criteria.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info notice */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        Audit events are cryptographically hashed and included in final store readiness export bundles.
      </div>

      {/* Manual Event Modal */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          role="presentation"
          onMouseDown={() => setIsLogModalOpen(false)}
        >
          <form
            onSubmit={handleAddEvent}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Log Manual Auditor Event</h3>
              <Button type="button" variant="ghost" className="h-7 w-7 px-0" onClick={() => setIsLogModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Event Title</label>
              <input
                required
                value={newEvent.event}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, event: e.target.value }))}
                placeholder="e.g. Legal Sign-Off on Health Data Exemption"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Auditor / Actor Name</label>
              <input
                required
                value={newEvent.person}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, person: e.target.value }))}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Audit Description & Notes</label>
              <textarea
                required
                rows={3}
                value={newEvent.detail}
                onChange={(e) => setNewEvent((prev) => ({ ...prev, detail: e.target.value }))}
                placeholder="Document verification steps, sign-off rationale, or ticket reference..."
                className="w-full rounded-md border border-border bg-background p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save Audit Event
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
