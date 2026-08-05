import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileUp,
  ListChecks,
  ShieldAlert,
} from "lucide-react";
import { activeProject, checks, dashboardStats, projects, testCases } from "../data/mockRelease";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

function toneForStatus(status: string) {
  if (status === "Passed" || status === "Ready") return "success";
  if (status === "Blocked") return "danger";
  if (status === "Warning" || status === "Needs review") return "warning";
  return "neutral";
}

export function Dashboard() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-5 shadow-panel">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="warning">{activeProject.status}</Badge>
                <span className="text-xs text-muted-foreground">{activeProject.platform}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-normal">{activeProject.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {activeProject.packageId} is being evaluated for Play Store submission with compliance,
                permissions, privacy policy, QA, and report modules connected to mock data.
              </p>
            </div>
            <div className="min-w-40 rounded-md border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Readiness score</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-semibold">{activeProject.readinessScore}</span>
                <span className="pb-1 text-sm text-muted-foreground">/100</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${activeProject.readinessScore}%` }} />
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button>
              <FileUp className="h-4 w-4" />
              Upload manifest
            </Button>
            <Button variant="secondary">
              <ListChecks className="h-4 w-4" />
              Generate QA cases
            </Button>
            <Button variant="ghost">
              View report
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Release Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Target submission</p>
              <p className="mt-1 text-lg font-semibold">{activeProject.releaseTarget}</p>
            </div>
            <div className="space-y-3">
              {["Upload artifacts", "Resolve blockers", "QA sign-off", "Generate final report"].map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Findings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Check</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Severity</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((check) => (
                    <tr key={check.title} className="border-b border-border last:border-0">
                      <td className="px-5 py-4 font-medium">{check.title}</td>
                      <td className="px-5 py-4">
                        <Badge tone={toneForStatus(check.status)}>{check.status}</Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{check.severity}</td>
                      <td className="px-5 py-4 text-muted-foreground">{check.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QA Test Case Drafts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {testCases.map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                <p className="text-sm leading-5">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.name}>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.platform}</p>
                </div>
                <Badge tone={toneForStatus(project.status)}>{project.status}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-3">
                {project.score >= 85 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : project.score >= 75 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                )}
                <div className="w-full">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Readiness</span>
                    <span>{project.score}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${project.score}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
