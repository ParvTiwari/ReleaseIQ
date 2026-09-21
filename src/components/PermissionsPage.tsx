import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCode2,
  FileKey,
  Info,
  KeyRound,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { defaultMockPermissions } from "../data/complianceRules";
import { notifyToast } from "../lib/alerts";
import type { ManifestArtifact, ParsedPermission, Project, Severity } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function riskTone(risk: Severity) {
  if (risk === "High") return "danger";
  if (risk === "Medium") return "warning";
  return "success";
}

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  return "warning";
}

export function PermissionsPage({
  project,
  manifest,
}: {
  project: Project;
  manifest?: ManifestArtifact;
}) {
  const [filterRisk, setFilterRisk] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const permissionsList: ParsedPermission[] =
    manifest?.permissions && manifest.permissions.length > 0
      ? manifest.permissions
      : defaultMockPermissions;

  const totalCount = permissionsList.length;
  const highRiskCount = permissionsList.filter((p) => p.risk === "High").length;
  const mediumRiskCount = permissionsList.filter((p) => p.risk === "Medium").length;
  const lowRiskCount = permissionsList.filter((p) => p.risk === "Low").length;
  const justificationRequiredCount = permissionsList.filter((p) => p.requiredJustification).length;

  const filteredPermissions = permissionsList.filter((perm) => {
    const matchesRisk = filterRisk === "All" || perm.risk === filterRisk;
    const matchesSearch =
      perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (perm.playStoreGuidance && perm.playStoreGuidance.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  const exportPermissionsAudit = () => {
    const auditData = {
      project: project.name,
      platform: project.platform,
      version: project.version,
      packageId: project.packageId,
      auditTimestamp: new Date().toISOString(),
      summary: {
        totalPermissions: totalCount,
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        lowRisk: lowRiskCount,
        justificationRequired: justificationRequiredCount,
      },
      permissions: permissionsList,
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}-permissions-audit.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    notifyToast({
      title: "Permission audit export downloaded",
      icon: "success",
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header Intro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Store Compliance & Device Access
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">Permission Risk Analysis</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review hardware and privacy permissions detected in <span className="font-semibold text-foreground">{project.name}</span> ({project.platform}) against official store declaration policies.
          </p>
        </div>
        <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Total Permissions</p>
              <p className="mt-1 text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">High-Risk (Blockers)</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">{highRiskCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/10 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Medium Sensitivity</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{mediumRiskCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Requires Store Justification</p>
              <p className="mt-1 text-2xl font-bold text-primary">{justificationRequiredCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileKey className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-md text-xs">
          {(["All", "High", "Medium", "Low"] as const).map((risk) => (
            <button
              type="button"
              key={risk}
              onClick={() => setFilterRisk(risk)}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filterRisk === risk
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {risk} Risk {risk === "All" ? `(${totalCount})` : risk === "High" ? `(${highRiskCount})` : risk === "Medium" ? `(${mediumRiskCount})` : `(${lowRiskCount})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions..."
              className="bg-transparent outline-none text-xs"
            />
          </label>
          <Button variant="secondary" onClick={exportPermissionsAudit}>
            <Download className="h-4 w-4 mr-1" /> Export Audit
          </Button>
        </div>
      </div>

      {/* Permissions Detail List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detected Permission Analysis ({filteredPermissions.length})</CardTitle>
            <span className="text-xs text-muted-foreground">
              Manifest source: {manifest?.name || "AndroidManifest.xml"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {filteredPermissions.map((perm) => (
            <div
              key={perm.name}
              className={`rounded-xl border p-5 transition ${
                perm.risk === "High"
                  ? "border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10"
                  : perm.risk === "Medium"
                  ? "border-amber-200 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{perm.name}</span>
                    <Badge tone={riskTone(perm.risk)}>{perm.risk} Risk</Badge>
                    {perm.requiredJustification && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                        Declaration Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-5">{perm.description}</p>
                </div>
              </div>

              {/* Policy Guidance & Action Box */}
              {perm.playStoreGuidance && (
                <div className="mt-4 rounded-lg border border-border/80 bg-background/60 p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    <span>Store Declaration & Compliance Guidance:</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-5">
                    {perm.playStoreGuidance}
                  </p>
                  {perm.risk === "High" && (
                    <div className="flex items-center gap-2 pl-5 pt-1 text-[11px] font-medium text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Rejection Risk: Prominent in-app disclosure must be displayed prior to runtime prompt.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredPermissions.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No permissions match your filter criteria.</p>
              <p className="text-xs text-muted-foreground">Try clearing your search query or selecting "All Risk".</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
