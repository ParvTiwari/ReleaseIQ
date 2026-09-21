import type { ComplianceFinding, ManifestArtifact, PrivacyPolicyArtifact, Project, TestCase } from "../types/release";
import { explainComplianceFindingInLayman, explainPermissionInLayman, explainPrivacyClauseInLayman } from "./laymanExplainer";

export interface ReportExportPayload {
  project: Project;
  manifest?: ManifestArtifact;
  privacyPolicy?: PrivacyPolicyArtifact;
  complianceFindings: ComplianceFinding[];
  testCases: TestCase[];
  generatedBy?: string;
}

/**
 * Generates a self-contained, beautifully styled HTML document.
 * When a PM or non-tech user opens it, it displays a complete executive release audit
 * without requiring any special software (opens directly in Chrome, Edge, Safari, etc.).
 */
export function generateHtmlReport(payload: ReportExportPayload): string {
  const { project, manifest, privacyPolicy, complianceFindings, testCases, generatedBy = "Parth Gupta" } = payload;
  const highBlockers = complianceFindings.filter((c) => c.status === "Blocked" || c.severity === "High");
  const warnings = complianceFindings.filter((c) => c.status === "Warning" || (c.severity === "Medium" && c.status !== "Blocked"));
  const passedChecks = complianceFindings.filter((c) => c.status === "Passed");
  const isApproved = highBlockers.length === 0 && project.readinessScore >= 80;
  const generatedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const auditHash = `AUDIT-${project.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const findingsHtml = complianceFindings.map((finding) => {
    const layman = explainComplianceFindingInLayman(finding);
    const isBlocker = finding.status === "Blocked" || finding.severity === "High";
    const isWarning = finding.status === "Warning" || (finding.severity === "Medium" && finding.status !== "Blocked");
    const statusClass = isBlocker ? "card-blocked" : isWarning ? "card-warning" : "card-passed";
    const badgeText = isBlocker ? "🛑 Store Blocker" : isWarning ? "⚠️ Review Warning" : "✅ Compliant";
    const badgeColor = isBlocker ? "#e11d48" : isWarning ? "#d97706" : "#059669";

    const stepsList = !isBlocker && !isWarning ? "" : `
      <div class="action-box">
        <strong>🛠️ Action Plan for ${layman.whoFixesIt}:</strong>
        <ol>
          ${layman.actionSteps.map((s) => `<li>${s}</li>`).join("")}
        </ol>
      </div>
    `;

    return `
      <div class="finding-card ${statusClass}">
        <div class="finding-header">
          <div>
            <span class="badge" style="background: ${badgeColor}15; color: ${badgeColor}; border: 1px solid ${badgeColor}30;">
              ${badgeText}
            </span>
            <span class="badge" style="background: #f1f5f9; color: #475569; margin-left: 6px;">
              👤 Assigned: ${layman.whoFixesIt}
            </span>
            <span class="badge" style="background: #f1f5f9; color: #475569; margin-left: 6px;">
              ⏱️ Fix Time: ${layman.estimatedEffort}
            </span>
          </div>
          <span style="font-size: 12px; font-weight: 700; color: ${badgeColor};">${layman.storeImpact}</span>
        </div>
        <h3 class="finding-title">${layman.plainTitle}</h3>
        <p class="finding-desc"><strong>What Happened:</strong> ${layman.whatWentWrong}</p>
        ${!isBlocker && !isWarning ? "" : `<p class="finding-impact"><strong>Why This Matters:</strong> ${layman.whyItMatters}</p>`}
        ${stepsList}
      </div>
    `;
  }).join("");

  const permissionsHtml = (manifest?.permissions || []).map((perm) => {
    const layman = explainPermissionInLayman(perm);
    const riskColor = layman.riskBadgeColor === "rose" ? "#e11d48" : layman.riskBadgeColor === "amber" ? "#d97706" : "#059669";
    return `
      <tr>
        <td><strong>${layman.friendlyName}</strong><br><span style="font-family: monospace; font-size: 11px; color: #64748b;">${perm.name}</span></td>
        <td>${layman.plainMeaning}</td>
        <td>${layman.storePolicyNotes}</td>
        <td><span class="badge" style="background: ${riskColor}15; color: ${riskColor};">${perm.risk} Risk</span></td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - Release Readiness Audit Report</title>
  <style>
    :root {
      --primary: #4f46e5;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      margin: 0;
      padding: 30px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 20px;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      margin: 4px 0 6px;
      font-size: 26px;
      font-weight: 800;
      color: var(--text);
    }
    .meta {
      font-size: 13px;
      color: var(--muted);
    }
    .verdict-banner {
      background: ${isApproved ? "#ecfdf5" : "#fff1f2"};
      border: 2px solid ${isApproved ? "#10b981" : "#f43f5e"};
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .verdict-title {
      font-size: 20px;
      font-weight: 800;
      color: ${isApproved ? "#065f46" : "#9f1239"};
      margin: 0 0 8px;
    }
    .verdict-desc {
      font-size: 14px;
      color: ${isApproved ? "#047857" : "#be123c"};
      margin: 0 0 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      border-top: 1px solid ${isApproved ? "#a7f3d0" : "#fecdd3"};
      padding-top: 16px;
      text-align: center;
    }
    .stat-box {
      background: #ffffff;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--muted);
    }
    .stat-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      margin-top: 2px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 32px 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .finding-card {
      background: var(--card);
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-blocked {
      border-left: 5px solid #e11d48;
      background: #fff5f5;
    }
    .card-warning {
      border-left: 5px solid #d97706;
      background: #fffbeb;
    }
    .card-passed {
      border-left: 5px solid #059669;
    }
    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .finding-title {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
    }
    .finding-desc {
      font-size: 13px;
      color: #334155;
      margin: 0 0 6px;
    }
    .finding-impact {
      font-size: 13px;
      color: #991b1b;
      margin: 0 0 10px;
    }
    .action-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      margin-top: 10px;
    }
    .action-box ol {
      margin: 6px 0 0;
      padding-left: 20px;
    }
    .action-box li {
      margin-bottom: 4px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: var(--card);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    th, td {
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">ReleaseIQ · Quality & Compliance Audit</div>
        <h1>Release Readiness Report: ${project.name}</h1>
        <div class="meta">${project.packageId} · Version ${project.version} · ${project.platform} · Target: ${project.releaseTarget}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: var(--muted);">Audited by</div>
        <div style="font-size: 14px; font-weight: 700;">${generatedBy}</div>
        <div style="font-size: 11px; color: var(--muted); font-family: monospace;">${auditHash}</div>
      </div>
    </div>

    <!-- Verdict Banner -->
    <div class="verdict-banner">
      <div class="verdict-title">
        ${isApproved ? "🚀 READY FOR STORE SUBMISSION" : "🚨 LAUNCH BLOCKED: IMMEDIATE ACTION REQUIRED"}
      </div>
      <div class="verdict-desc">
        ${isApproved
          ? "All compliance checks, store policies, manifest permissions, and QA suites have passed. The build is safe for release."
          : `${highBlockers.length} critical store rejection issue(s) and ${warnings.length} warning(s) detected. Submission will be rejected by store reviewers unless resolved.`}
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Readiness Score</div>
          <div class="stat-value" style="color: ${isApproved ? "#059669" : "#e11d48"};">${project.readinessScore}/100</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Critical Blockers</div>
          <div class="stat-value" style="color: #e11d48;">${highBlockers.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Review Warnings</div>
          <div class="stat-value" style="color: #d97706;">${warnings.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">QA Test Suite</div>
          <div class="stat-value" style="color: var(--primary);">${testCases.filter(t => t.status === "Passed").length}/${testCases.length}</div>
        </div>
      </div>
    </div>

    <!-- What Went Wrong / Plain English Findings -->
    <div class="section-title">🧩 What Went Wrong: Plain-English Findings & Action Items</div>
    ${findingsHtml}

    <!-- Permissions Table -->
    <div class="section-title">📱 App Permissions Guide (Device Access)</div>
    <table>
      <thead>
        <tr>
          <th>Permission Name</th>
          <th>What It Does (Plain English)</th>
          <th>Store Requirement</th>
          <th>Risk Level</th>
        </tr>
      </thead>
      <tbody>
        ${permissionsHtml || '<tr><td colspan="4" style="text-align: center; color: var(--muted);">No permissions declared.</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      <div>© 2026 ReleaseIQ Assurance Engine · Generated on ${generatedDate}</div>
      <div>Audit Certificate: ${auditHash}</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates a clean Markdown report for Slack, Jira tickets, Notion, or Confluence.
 */
export function generateMarkdownReport(payload: ReportExportPayload): string {
  const { project, manifest, complianceFindings, testCases, generatedBy = "Parth Gupta" } = payload;
  const highBlockers = complianceFindings.filter((c) => c.status === "Blocked" || c.severity === "High");
  const warnings = complianceFindings.filter((c) => c.status === "Warning" || (c.severity === "Medium" && c.status !== "Blocked"));
  const isApproved = highBlockers.length === 0 && project.readinessScore >= 80;

  return `# 🚀 Release Readiness Audit Report: ${project.name}

- **Package ID:** \`${project.packageId}\`
- **Platform:** ${project.platform} (v${project.version})
- **Target Launch:** ${project.releaseTarget}
- **Readiness Score:** **${project.readinessScore}/100**
- **Audited By:** ${generatedBy}
- **Verdict:** ${isApproved ? "✅ **APPROVED FOR STORE SUBMISSION**" : "🚨 **SUBMISSION BLOCKED — ACTION REQUIRED**"}

---

## 📊 Summary
- **Critical Blockers (Immediate Store Rejection):** ${highBlockers.length}
- **Review Warnings (Potential Delay):** ${warnings.length}
- **QA Test Cases Passed:** ${testCases.filter(t => t.status === "Passed").length}/${testCases.length}

---

## 🧩 What Went Wrong (Plain-English Breakdown)

${complianceFindings.map((cf, idx) => {
  const layman = explainComplianceFindingInLayman(cf);
  const icon = cf.status === "Blocked" ? "🛑" : cf.status === "Warning" ? "⚠️" : "✅";
  return `### ${idx + 1}. ${icon} ${layman.plainTitle}
- **Status:** ${cf.status} (${cf.severity} Severity)
- **Assigned Team:** **${layman.whoFixesIt}**
- **Estimated Fix Time:** ${layman.estimatedEffort}
- **Store Impact:** ${layman.storeImpact}

**What Happened:**
${layman.whatWentWrong}

**Why This Matters:**
${layman.whyItMatters}

**Action Plan:**
${layman.actionSteps.map(s => `- ${s}`).join("\n")}
`;
}).join("\n---\n\n")}

---

## 📱 Requested App Permissions
${(manifest?.permissions || []).map(p => {
  const layman = explainPermissionInLayman(p);
  return `- **${layman.friendlyName}** (\`${p.name}\`) — *${p.risk} Risk*\n  - Meaning: ${layman.plainMeaning}\n  - Store Rule: ${layman.storePolicyNotes}`;
}).join("\n")}

---
*Generated by ReleaseIQ Engine on ${new Date().toISOString()}*
`;
}
