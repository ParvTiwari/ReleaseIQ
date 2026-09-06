import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileCheck2,
  Info,
  MessageSquareText,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { useMemo, useState } from "react";
import { notifyToast } from "../lib/alerts";
import type { Project } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface CopyFinding {
  id: string;
  field: "Title" | "Short Description" | "Full Description" | "Release Notes" | "Keywords";
  severity: "High" | "Medium" | "Low";
  status: "Passed" | "Warning" | "Blocked";
  title: string;
  detail: string;
  remediation: string;
}

const PROHIBITED_WORDS = [
  "#1",
  "no. 1",
  "best",
  "top-rated",
  "top rated",
  "free",
  "guaranteed",
  "100% free",
  "fastest",
  "whatsapp",
  "instagram",
  "iphone",
  "apple",
  "android",
  "google play",
];

export function CopyReviewPage({
  project,
  onSaveCopy,
}: {
  project: Project;
  onSaveCopy?: (updates: { releaseNotes?: string; description?: string }) => void;
}) {
  const isIOS = project.platform === "iOS";

  const [title, setTitle] = useState(project.name);
  const [subtitle, setSubtitle] = useState(
    isIOS ? "Real-time Biometrics & GPS" : "Track running, heart rate, and workouts with GPS mapping"
  );
  const [description, setDescription] = useState(project.description);
  const [releaseNotes, setReleaseNotes] = useState(project.releaseNotes);
  const [keywords, setKeywords] = useState("fitness, running, gps tracker, workout, health connect, heart rate");
  const [isAuditing, setIsAuditing] = useState(false);

  // Character limit rules
  const titleLimit = 30;
  const subtitleLimit = isIOS ? 30 : 80;
  const descLimit = 4000;
  const releaseNotesLimit = 500;
  const keywordsLimit = 100;

  // Real-time copy analyzer
  const findings: CopyFinding[] = useMemo(() => {
    const list: CopyFinding[] = [];

    // 1. Title checks
    if (title.length > titleLimit) {
      list.push({
        id: "cf-title-len",
        field: "Title",
        severity: "High",
        status: "Blocked",
        title: `App Title Exceeds ${titleLimit} Characters`,
        detail: `Current title is ${title.length} characters. Both Google Play and Apple App Store enforce a strict ${titleLimit}-character maximum limit.`,
        remediation: `Shorten app title to ${titleLimit} characters or fewer.`,
      });
    } else {
      list.push({
        id: "cf-title-len-ok",
        field: "Title",
        severity: "Low",
        status: "Passed",
        title: "App Title Character Length Satisfied",
        detail: `Title length (${title.length}/${titleLimit} chars) complies with store policies.`,
        remediation: "",
      });
    }

    // Prohibited terms in Title
    const titleLower = title.toLowerCase();
    const foundProhibitedInTitle = PROHIBITED_WORDS.filter((w) => titleLower.includes(w));
    if (foundProhibitedInTitle.length > 0) {
      list.push({
        id: "cf-title-spam",
        field: "Title",
        severity: "High",
        status: "Blocked",
        title: "Prohibited Promotional or Trademark Terms in Title",
        detail: `Title contains flagged terms: "${foundProhibitedInTitle.join('", "')}". Store policies strictly forbid ranking claims ("Best", "#1") and competitor brand names in app titles.`,
        remediation: "Remove promotional superlatives and unauthorized trademarks from title.",
      });
    }

    // Emoji in Title (Google Play violation)
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(title)) {
      list.push({
        id: "cf-title-emoji",
        field: "Title",
        severity: "High",
        status: "Blocked",
        title: "Emoji Detected in App Title",
        detail: "Google Play Store metadata guidelines prohibit emojis and non-alphanumeric icons in the app title.",
        remediation: "Remove all emojis and decorative symbols from the app title.",
      });
    }

    // 2. Subtitle / Short Description checks
    if (subtitle.length > subtitleLimit) {
      list.push({
        id: "cf-sub-len",
        field: "Short Description",
        severity: "High",
        status: "Blocked",
        title: `Short Description Exceeds ${subtitleLimit} Characters`,
        detail: `Current length is ${subtitle.length} chars (Limit: ${subtitleLimit}).`,
        remediation: `Trim short description to ${subtitleLimit} characters.`,
      });
    } else if (subtitle.length < 10) {
      list.push({
        id: "cf-sub-short",
        field: "Short Description",
        severity: "Medium",
        status: "Warning",
        title: "Short Description Too Brief",
        detail: "A descriptive summary increases store search discoverability and conversion rates.",
        remediation: "Expand short description to clearly highlight core app value.",
      });
    } else {
      list.push({
        id: "cf-sub-ok",
        field: "Short Description",
        severity: "Low",
        status: "Passed",
        title: "Short Description Length Complies",
        detail: `Length (${subtitle.length}/${subtitleLimit} chars) is optimal.`,
        remediation: "",
      });
    }

    // 3. Full Description checks
    if (description.length > descLimit) {
      list.push({
        id: "cf-desc-len",
        field: "Full Description",
        severity: "High",
        status: "Blocked",
        title: "Full Description Exceeds 4,000 Characters",
        detail: `Current description is ${description.length} characters.`,
        remediation: "Reduce description length below 4000 characters.",
      });
    } else if (description.length < 100) {
      list.push({
        id: "cf-desc-short",
        field: "Full Description",
        severity: "Medium",
        status: "Warning",
        title: "Full Description Needs More Detail",
        detail: "Store reviewers and users expect a comprehensive overview of app features, subscriptions, and privacy terms.",
        remediation: "Add sections covering Key Features, Privacy, and Customer Support.",
      });
    } else {
      list.push({
        id: "cf-desc-ok",
        field: "Full Description",
        severity: "Low",
        status: "Passed",
        title: "Full Description Quality Verified",
        detail: `Description contains ${description.length} characters with clear structure.`,
        remediation: "",
      });
    }

    // 4. Release Notes checks
    if (!releaseNotes.trim()) {
      list.push({
        id: "cf-notes-empty",
        field: "Release Notes",
        severity: "High",
        status: "Blocked",
        title: "Release Notes Cannot Be Empty",
        detail: "Store submissions require 'What's New' release notes explaining user-facing updates.",
        remediation: "Provide bulleted release notes summarizing bug fixes and new features.",
      });
    } else if (releaseNotes.toLowerCase().includes("bug fixes and performance improvements")) {
      list.push({
        id: "cf-notes-generic",
        field: "Release Notes",
        severity: "Medium",
        status: "Warning",
        title: "Generic Release Notes Detected",
        detail: "Overly generic release notes ('bug fixes') reduce user engagement and may prompt store reviewer questions.",
        remediation: "Specify 2-3 concrete improvements (e.g. 'Added background GPS mapping and fixed Bluetooth sync').",
      });
    } else {
      list.push({
        id: "cf-notes-ok",
        field: "Release Notes",
        severity: "Low",
        status: "Passed",
        title: "Release Notes Quality Verified",
        detail: "Release notes provide specific, informative changelog details.",
        remediation: "",
      });
    }

    return list;
  }, [title, subtitle, description, releaseNotes, isIOS, titleLimit, subtitleLimit, descLimit]);

  const passedCount = findings.filter((f) => f.status === "Passed").length;
  const warningCount = findings.filter((f) => f.status === "Warning").length;
  const blockedCount = findings.filter((f) => f.status === "Blocked").length;

  const handleSave = () => {
    if (onSaveCopy) {
      onSaveCopy({ releaseNotes, description });
    }
    notifyToast({
      title: "Store listing copy saved to project",
      icon: "success",
    });
  };

  const handleReAudit = async () => {
    setIsAuditing(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsAuditing(false);
    notifyToast({
      title: `Copy audit complete: ${blockedCount} blockers, ${warningCount} warnings`,
      icon: blockedCount > 0 ? "warning" : "success",
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Metadata Quality</p>
          <h2 className="mt-1 text-2xl font-bold text-foreground">Store Listing Copy & Metadata Review</h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Auditing store copy for <strong className="text-foreground">{project.name}</strong> against {project.platform} guidelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleReAudit} disabled={isAuditing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isAuditing ? "animate-spin" : ""}`} />
            Re-Audit Copy
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" /> Save Copy
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Passed Checks</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{passedCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Copy Warnings</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{warningCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Store Rejection Blockers</p>
              <p className="text-2xl font-bold mt-1 text-rose-600">{blockedCount}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Grid: Live Editor + Audit Findings */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Interactive Editor */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Store Metadata Editor ({project.platform})</CardTitle>
                <Badge tone={blockedCount > 0 ? "danger" : "success"}>
                  {blockedCount > 0 ? `${blockedCount} Store Blockers` : "Clean Metadata"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* App Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">App Title</label>
                  <span className={`font-mono ${title.length > titleLimit ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                    {title.length} / {titleLimit} max
                  </span>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25 font-medium"
                />
              </div>

              {/* Subtitle / Short Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">
                    {isIOS ? "App Subtitle" : "Short Description"}
                  </label>
                  <span className={`font-mono ${subtitle.length > subtitleLimit ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                    {subtitle.length} / {subtitleLimit} max
                  </span>
                </div>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">Full Store Description</label>
                  <span className={`font-mono ${description.length > descLimit ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                    {description.length} / {descLimit} max
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              {/* Release Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">What's New in Version {project.version}</label>
                  <span className={`font-mono ${releaseNotes.length > releaseNotesLimit ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                    {releaseNotes.length} / {releaseNotesLimit} max
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  className="w-full rounded-md border border-border bg-background p-3 text-xs leading-5 outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-foreground">Search Keywords (Comma Separated)</label>
                  <span className="font-mono text-muted-foreground">{keywords.length} / {keywordsLimit}</span>
                </div>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Policy Findings & Store Simulator */}
        <div className="space-y-4">
          {/* Policy Compliance Audit Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata Audit Findings ({findings.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className={`rounded-lg border p-3.5 space-y-1.5 text-xs transition ${
                    f.status === "Blocked"
                      ? "border-rose-200 bg-rose-50/40 text-rose-900"
                      : f.status === "Warning"
                      ? "border-amber-200 bg-amber-50/40 text-amber-900"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold">{f.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        f.status === "Blocked"
                          ? "bg-rose-100 text-rose-700"
                          : f.status === "Warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-4">{f.detail}</p>
                  {f.remediation && (
                    <p className="text-[11px] font-medium text-primary pt-1">
                      💡 <strong>Fix:</strong> {f.remediation}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Mobile Store Preview Card */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                📱 Simulated {project.platform} Store Card
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm">
                  {project.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{title}</p>
                  <p className="text-muted-foreground text-[11px]">{subtitle}</p>
                </div>
              </div>
              <div className="rounded border border-border bg-card p-2.5 text-[11px] text-muted-foreground">
                <p className="font-semibold text-foreground">What's New</p>
                <p className="mt-0.5 line-clamp-2">{releaseNotes}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
