import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportSubmissionPage } from './pages/ReportSubmissionPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { CivicAssistantPage } from './pages/CivicAssistantPage';
import { IncidentMapPage } from './pages/IncidentMapPage';
import { UserReportsPage } from './pages/UserReportsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminReportReviewPage } from './pages/AdminReportReviewPage';
import { DuplicateReviewPage } from './pages/DuplicateReviewPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { SettingsPrivacyPage } from './pages/SettingsPrivacyPage';
import { api } from './services/api';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'citizen' | 'admin' }> = ({
  children,
  requiredRole
}) => {
  const user = api.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage initialMode="login" />} />
            <Route path="/register" element={<AuthPage initialMode="register" />} />
            <Route path="/map" element={<IncidentMapPage />} />
            <Route path="/assistant" element={<CivicAssistantPage />} />
            <Route path="/incident/:id" element={<IncidentDetailPage />} />

            {/* Citizen Protected Pages */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportSubmissionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <UserReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Administrator Protected Pages */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/review"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminReportReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/duplicates"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DuplicateReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/knowledge"
              element={
                <ProtectedRoute requiredRole="admin">
                  <KnowledgeBasePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/evaluations"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ModelEvaluationPage />
                </ProtectedRoute>
              }
            />

            {/* Settings & Privacy */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPrivacyPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
