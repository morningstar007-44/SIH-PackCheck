import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InspectionProvider } from './contexts/InspectionContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { OverviewPage } from './pages/OverviewPage';
import { NewInspectionPage } from './pages/NewInspectionPage';
import { CameraPage } from './pages/CameraPage';
import { ImagePreviewPage } from './pages/ImagePreviewPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { InspectionResultPage } from './pages/InspectionResultPage';
import { EvidenceReviewPage } from './pages/EvidenceReviewPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportPage } from './pages/ReportPage';
import { RulesPage } from './pages/RulesPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InspectionProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Protected Routes wrapped in AppShell Layout */}
            <Route
              path="/overview"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <OverviewPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/new"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <NewInspectionPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/new/camera"
              element={
                <ProtectedRoute>
                  <CameraPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/new/preview"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ImagePreviewPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/processing"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ProcessingPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/:id/result"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionResultPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/:id/evidence"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <EvidenceReviewPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspection/:id/report"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ReportPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <HistoryPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/rules"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <RulesPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <SettingsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Default Catch-all redirect */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </InspectionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
