# ReleaseIQ Documentation

## 1. Project Overview

**Project Name:** ReleaseIQ — AI-Powered Mobile App Release Readiness & Quality Assurance Platform

**Vision:**
ReleaseIQ empowers mobile app teams to validate release readiness through a unified web platform that consolidates permission checks, privacy policy validation, compliance guidance, and release readiness reporting.

**Current Phase:**
Frontend design and documentation only. Backend/AI will be mocked with JSON data in this phase.

## 2. Software Requirements Specification (SRS)

### 2.1 Purpose

The SRS defines the product, primary stakeholders, high-level functional and non-functional requirements, system boundaries, and the architectural approach for the ReleaseIQ frontend product.

### 2.2 Scope

ReleaseIQ is a responsive web application built with React, TypeScript, Tailwind CSS, and shadcn/ui. It provides an interface for uploading app metadata, reviewing compliance checks, generating QA test cases, and viewing release readiness status using mocked data.

### 2.3 Stakeholders

- Mobile Application Developers
- QA Engineers
- Software Development Teams
- Project Managers
- Product Owners

### 2.4 System Overview

The system consists of a secure SaaS-style dashboard with modules for:
- User authentication and onboarding
- Project creation and management
- Uploading app details, privacy policy, AndroidManifest.xml
- AI compliance and permission analysis
- Test case generation and readiness scoring
- Report generation and history tracking

## 3. Functional Requirements

### 3.1 Authentication & Access

FR-1: Users can sign up and sign in using email/password.
FR-2: Authenticated users can log out.
FR-3: Authenticated users can reset their password.

### 3.2 Dashboard

FR-4: Users see a dashboard summary with projects, readiness score, pending checks, and recent activity.
FR-5: Dashboard cards show release readiness, compliance status, and privacy policy validation status.

### 3.3 Project Management

FR-6: Users can create a new project with name, platform, description, and release target.
FR-7: Users can view a project list and select a project.
FR-8: Users can edit or delete a project.

### 3.4 Upload Application Details

FR-9: Users can upload or enter app metadata including app name, package ID, version, release notes, and app category.
FR-10: Users can upload a mock `AndroidManifest.xml` file via file selector.

### 3.5 Upload Privacy Policy

FR-11: Users can upload a privacy policy document or paste privacy policy text.
FR-12: The system stores the privacy policy data as part of project details.

### 3.6 AI Compliance Analysis

FR-13: The platform displays compliance checks for app store policies and permissions based on the uploaded data.
FR-14: The platform shows whether each compliance item passes, warns, or fails.

### 3.7 Permission Analysis

FR-15: The app extracts permissions from the uploaded `AndroidManifest.xml` and displays risk levels.
FR-16: Permission analysis includes explanation text and guidance for each permission.

### 3.8 Privacy Policy Validation

FR-17: The UI shows privacy-policy validation results for required clauses, tracking disclosures, data sharing, and user rights.
FR-18: Each validation item has status, severity, and recommended action.

### 3.9 AI Test Case Generator

FR-19: The platform generates QA test cases from app metadata and compliance findings.
FR-20: Users can view categorized test cases for functional, security, privacy, and release verification.

### 3.10 Release Readiness Assessment

FR-21: Release readiness is displayed as a composite score and risk level.
FR-22: Users can see a checklist of readiness items and completion status.

### 3.11 Report Generation

FR-23: Users can preview a release readiness report.
FR-24: The report includes compliance summary, permission findings, privacy validation, test cases, and recommendations.

### 3.12 Project History

FR-25: Users can view historical project snapshots with timestamps.
FR-26: The project history page displays previous readiness scores and key findings.

## 4. Non-Functional Requirements

### 4.1 Performance

NFR-1: The frontend should render core dashboard views in under 1 second on modern browsers.
NFR-2: Page transitions should feel responsive and smooth.

### 4.2 Usability

NFR-3: The UI should be mobile-responsive and accessible.
NFR-4: The design should follow a modern SaaS dashboard aesthetic.

### 4.3 Security

NFR-5: Sensitive user actions are protected by authentication flows.
NFR-6: The frontend should never expose API keys or secrets.

### 4.4 Maintainability

NFR-7: Use reusable component patterns and modular folder structure.
NFR-8: Keep UI logic separated from mock data and state management.

### 4.5 Scalability

NFR-9: The component design should support eventual backend integration with real APIs.

## 5. User Roles

- Guest / Visitor
- Registered User
- Project Owner
- QA Reviewer

### Role Capabilities

- Guest: view auth pages, sign up / sign in.
- Registered User: create and manage projects, upload app details, view dashboard, generate reports.
- Project Owner: full control over project settings, history, and readiness evaluation.
- QA Reviewer: inspect compliance findings, review generated test cases, and validate release status.

## 6. User Stories

### 6.1 Authentication

- As a developer, I want to sign up so I can start using ReleaseIQ.
- As a user, I want to sign in so I can access my projects.
- As a user, I want to reset my password if I forget it.

### 6.2 Project Management

- As a developer, I want to create a release project so I can manage readiness checks.
- As a QA engineer, I want to view a list of projects so I can choose one to audit.
- As a product owner, I want to see project history so I can compare past readiness results.

### 6.3 Compliance and Uploads

- As a developer, I want to upload my Android manifest so ReleaseIQ can analyze permissions.
- As a developer, I want to upload or paste my privacy policy so ReleaseIQ can validate it.
- As a QA engineer, I want to see compliance status so I can identify release blockers.

### 6.4 Assessment and Reporting

- As a user, I want a release readiness score so I can understand how prepared my app is.
- As a QA engineer, I want test cases generated automatically so I can start testing faster.
- As a developer, I want a downloadable summary report so I can share release status with stakeholders.

## 7. Feature List

### Core Features

- User signup/signin/reset password
- Responsive SaaS dashboard
- Project creation, edit, delete
- Upload or enter app metadata
- Upload `AndroidManifest.xml`
- Upload/paste privacy policy
- Mocked compliance analysis view
- Permission risk dashboard
- Privacy policy validation panel
- AI-style test case generation module
- Release readiness score and checklist
- Historical project snapshots
- Report preview page

### Nice-to-have UI Features

- Dark mode toggle (optional)
- Search/filter project list
- Status badges and visual risk indicators
- Progress bars and charts

## 8. Product Flow

### Primary User Flow

1. User lands on auth page and signs in.
2. User arrives at the dashboard overview.
3. User creates a new project.
4. User uploads app metadata, privacy policy, and Android manifest.
5. System displays compliance and permission findings.
6. User reviews readiness score and generated test cases.
7. User previews the final release report.
8. User navigates to project history for past audits.

### Alternative Flow

- User returns to an existing project and edits uploaded details.
- If privacy policy is missing, the validation panel shows warnings.
- If manifest permissions are risky, the readiness score drops and remediation guidance appears.

## 9. Information Architecture

### Top-Level Navigation

- Dashboard
- Projects
- Compliance
- Privacy Policy
- Permissions
- QA Test Cases
- Reports
- History
- Account

### Data Entities

- User
- Project
- App Metadata
- Privacy Policy
- Android Manifest
- Compliance Finding
- Permission Finding
- Test Case
- Readiness Report
- History Snapshot

### Data Relationships

- User owns multiple Projects
- Project contains one App Metadata record
- Project contains one Privacy Policy record
- Project contains one Android Manifest record
- Project contains many Compliance Findings and Permission Findings
- Project contains many Test Cases
- Project contains multiple History Snapshots

## 10. Screen List

### Authentication Screens

- Sign In
- Sign Up
- Forgot Password
- Password Reset Confirmation

### Main Screens

- Dashboard
- Project List
- Project Detail / Overview
- App Detail Upload
- Privacy Policy Upload / Validation
- Android Manifest Upload / Permissions
- Compliance Analysis
- QA Test Case Generator
- Release Report Preview
- Project History
- Account / Profile

### Supporting UI Elements

- Project creation modal
- File upload form
- Data summary cards
- Status badges and progress indicators
- Report summary panels

## 11. Database Design (Mock Schema)

### Entities and Key Fields

- `users`
  - `id`, `name`, `email`, `passwordHash`, `createdAt`

- `projects`
  - `id`, `userId`, `name`, `platform`, `description`, `releaseTarget`, `createdAt`, `updatedAt`

- `app_metadata`
  - `id`, `projectId`, `appName`, `packageId`, `version`, `releaseNotes`, `category`, `platform`

- `privacy_policies`
  - `id`, `projectId`, `content`, `status`, `issues`, `lastValidatedAt`

- `android_manifests`
  - `id`, `projectId`, `rawXml`, `permissions`, `parsedAt`

- `compliance_findings`
  - `id`, `projectId`, `title`, `status`, `severity`, `description`, `recommendation`

- `permission_findings`
  - `id`, `projectId`, `permissionName`, `riskLevel`, `description`, `recommendation`

- `test_cases`
  - `id`, `projectId`, `category`, `title`, `description`, `status`

- `reports`
  - `id`, `projectId`, `summary`, `readinessScore`, `createdAt`

- `history_snapshots`
  - `id`, `projectId`, `snapshotDate`, `score`, `summary`

### Notes

In this phase, the data will be mocked in JSON. The database design is intended for future backend integration.

## 12. API Planning

### Authentication

- `POST /api/auth/signup` — create user
- `POST /api/auth/signin` — login user
- `POST /api/auth/forgot-password` — trigger reset email
- `POST /api/auth/reset-password` — update password

### Projects

- `GET /api/projects` — list projects
- `POST /api/projects` — create project
- `GET /api/projects/:id` — project detail
- `PATCH /api/projects/:id` — update project
- `DELETE /api/projects/:id` — delete project

### App Data

- `POST /api/projects/:id/app-metadata` — upload app details
- `POST /api/projects/:id/privacy-policy` — upload privacy policy
- `POST /api/projects/:id/android-manifest` — upload manifest

### Analysis & Reports

- `GET /api/projects/:id/compliance` — get compliance findings
- `GET /api/projects/:id/permissions` — get permission analysis
- `GET /api/projects/:id/privacy-validation` — get privacy validation
- `GET /api/projects/:id/test-cases` — get generated test cases
- `GET /api/projects/:id/readiness` — get readiness assessment
- `GET /api/projects/:id/report` — get report preview
- `GET /api/projects/:id/history` — get project history

### Mock Data Considerations

Frontend will begin with a mocked API layer or static JSON files. Each endpoint should return realistic objects matching the schema above.

## 13. Future Scope

### Phase 2: Backend & AI Integration

- Replace mock JSON with FastAPI endpoints
- Implement PostgreSQL persistence
- Add real AI analysis using LangChain / LangGraph
- Integrate OpenAI / Gemini / open-source LLMs for compliance and test generation
- Add file upload storage and document parsing

### Phase 3: Production Features

- Role-based access control
- Multi-tenant organization support
- Notifications and alerts
- Export report to PDF
- Slack/email release readiness notifications
- Real-time collaboration and comments

### Long-term Extensions

- iOS App Store release guidance
- CI/CD release pipeline integrations
- Automated app store policy monitoring
- Mobile app companion for release tracking

---

## Next Step

Review this documentation and confirm the sections you want to refine first. After approval, we can start building the frontend components module by module with mock data.
