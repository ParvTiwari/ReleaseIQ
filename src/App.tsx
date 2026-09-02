import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { AppDetails } from "./components/AppDetails";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { NewProjectModal } from "./components/NewProjectModal";
import { Projects } from "./components/Projects";
import { ReportPage } from "./components/ReportPage";
import {
  CompliancePage,
  CopyReviewPage,
  HistoryPage,
  TestCasesPage,
} from "./components/StaticReleasePages";
import { UploadsPage } from "./components/UploadsPage";
import { ReleaseProvider, useRelease } from "./context/ReleaseContext";

function AppContent() {
  const navigate = useNavigate();
  const {
    projects,
    activeProjectId,
    activeProject,
    selectProject,
    createProject,
    saveAppDetails,
    activeManifest,
    activePrivacyPolicy,
    activeCompliance,
    activeTestCases,
    activeCustomRules,
    openBlockersCount,
    handleUploadManifest,
    handleUploadPrivacyPolicy,
    handleToggleTestCaseStatus,
    handleAddCustomRule,
    isNewProjectOpen,
    setIsNewProjectOpen,
  } = useRelease();

  const handleSelectProjectAndNavigate = (id: string) => {
    selectProject(id);
    navigate("/dashboard");
  };

  return (
    <>
      <AppShell
        openBlockersCount={openBlockersCount}
        onNewProject={() => setIsNewProjectOpen(true)}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                activeProject={activeProject}
                projects={projects}
                complianceFindings={activeCompliance}
                testCases={activeTestCases}
                onSelectProject={handleSelectProjectAndNavigate}
                onViewProjects={() => navigate("/projects")}
                onNavigateToUploads={() => navigate("/uploads")}
                onNavigateToTestCases={() => navigate("/test-cases")}
                onNavigateToReport={() => navigate("/reports")}
              />
            }
          />
          <Route
            path="/projects"
            element={
              <Projects
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={handleSelectProjectAndNavigate}
              />
            }
          />
          <Route
            path="/app-details"
            element={
              <AppDetails project={activeProject} onSave={saveAppDetails} />
            }
          />
          <Route
            path="/uploads"
            element={
              <UploadsPage
                project={activeProject}
                manifest={activeManifest}
                privacyPolicy={activePrivacyPolicy}
                onUploadManifest={handleUploadManifest}
                onUploadPrivacyPolicy={handleUploadPrivacyPolicy}
              />
            }
          />
          <Route
            path="/compliance"
            element={
              <CompliancePage
                project={activeProject}
                complianceFindings={activeCompliance}
                customRules={activeCustomRules}
                onAddCustomRule={handleAddCustomRule}
              />
            }
          />
          <Route
            path="/test-cases"
            element={
              <TestCasesPage
                project={activeProject}
                testCases={activeTestCases}
                onToggleStatus={handleToggleTestCaseStatus}
              />
            }
          />
          <Route
            path="/copy-review"
            element={<CopyReviewPage project={activeProject} />}
          />
          <Route
            path="/reports"
            element={
              <ReportPage
                project={activeProject}
                manifest={activeManifest}
                privacyPolicy={activePrivacyPolicy}
                complianceFindings={activeCompliance}
                testCases={activeTestCases}
              />
            }
          />
          <Route
            path="/history"
            element={<HistoryPage project={activeProject} />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>

      {isNewProjectOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectOpen(false)}
          onCreate={(fields) => {
            createProject(fields);
            navigate("/dashboard");
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ReleaseProvider>
        <AppContent />
      </ReleaseProvider>
    </BrowserRouter>
  );
}
