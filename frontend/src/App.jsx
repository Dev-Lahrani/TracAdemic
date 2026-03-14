import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ProfessorDashboard = lazy(() => import('./pages/professor/ProfessorDashboard'));
const CreateProjectPage = lazy(() => import('./pages/professor/CreateProjectPage'));
const ProjectDetailPage = lazy(() => import('./pages/professor/ProjectDetailPage'));
const ProjectAnalyticsPage = lazy(() => import('./pages/professor/ProjectAnalyticsPage'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const JoinProjectPage = lazy(() => import('./pages/student/JoinProjectPage'));
const SubmitUpdatePage = lazy(() => import('./pages/student/SubmitUpdatePage'));
const StudentProjectDetailPage = lazy(() => import('./pages/student/StudentProjectDetailPage'));
const DocumentsPage = lazy(() => import('./pages/shared/DocumentsPage'));
const DoubtsPage = lazy(() => import('./pages/shared/DoubtsPage'));
const MeetingsPage = lazy(() => import('./pages/shared/MeetingsPage'));
const EvaluationsPage = lazy(() => import('./pages/shared/EvaluationsPage'));
const IndustryProjectsPage = lazy(() => import('./pages/shared/IndustryProjectsPage'));
const PeerReviewPage = lazy(() => import('./pages/shared/PeerReviewPage'));
const PredictiveAnalyticsPage = lazy(() => import('./pages/shared/PredictiveAnalyticsPage'));
const CodeReviewPage = lazy(() => import('./pages/shared/CodeReviewPage'));
const VoiceUpdatePage = lazy(() => import('./pages/shared/VoiceUpdatePage'));

/** Protected route – redirects to /login if unauthenticated */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'professor' ? '/professor/dashboard' : '/student/dashboard'} replace />;
  }
  return children;
};

/** Layout wrapper that shows the navbar */
const Layout = ({ children }) => (
  <div className="pt-16 min-h-screen">
    <Navbar />
    <main>{children}</main>
  </div>
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner text="Loading…" />
  </div>
);

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading…" />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'professor' ? '/professor/dashboard' : '/student/dashboard'} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'professor' ? '/professor/dashboard' : '/student/dashboard'} replace /> : <RegisterPage />} />

        {/* Professor routes */}
        <Route path="/professor/dashboard" element={
          <PrivateRoute allowedRoles={['professor']}>
            <Layout><ProfessorDashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/professor/projects/new" element={
          <PrivateRoute allowedRoles={['professor']}>
            <Layout><CreateProjectPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/professor/projects/:id" element={
          <PrivateRoute allowedRoles={['professor']}>
            <Layout><ProjectDetailPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/professor/projects" element={<Navigate to="/professor/dashboard" replace />} />

        {/* Student routes */}
        <Route path="/student/dashboard" element={
          <PrivateRoute allowedRoles={['student']}>
            <Layout><StudentDashboard /></Layout>
          </PrivateRoute>
        } />
        <Route path="/student/join" element={
          <PrivateRoute allowedRoles={['student']}>
            <Layout><JoinProjectPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/student/projects/:projectId" element={
          <PrivateRoute allowedRoles={['student']}>
            <Layout><StudentProjectDetailPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/student/projects/:projectId/submit" element={
          <PrivateRoute allowedRoles={['student']}>
            <Layout><SubmitUpdatePage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/student/projects" element={<Navigate to="/student/dashboard" replace />} />

        {/* Professor analytics route */}
        <Route path="/professor/projects/:id/analytics" element={
          <PrivateRoute allowedRoles={['professor']}>
            <Layout><ProjectAnalyticsPage /></Layout>
          </PrivateRoute>
        } />

        {/* Shared routes - Documents, Doubts, Meetings, Evaluations, Industry Projects */}
        <Route path="/projects/:projectId/documents" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><DocumentsPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/projects/:projectId/doubts" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><DoubtsPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/projects/:projectId/meetings" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><MeetingsPage /></Layout>
          </PrivateRoute>
        } />
        <Route path="/projects/:projectId/evaluations" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><EvaluationsPage /></Layout>
          </PrivateRoute>
        } />
        
        {/* Industry Projects */}
        <Route path="/industry" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><IndustryProjectsPage /></Layout>
          </PrivateRoute>
        } />

        {/* Peer Review */}
        <Route path="/peer-review/:projectId" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><PeerReviewPage /></Layout>
          </PrivateRoute>
        } />

        {/* Code Review */}
        <Route path="/projects/:projectId/code-review" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><CodeReviewPage /></Layout>
          </PrivateRoute>
        } />

        {/* Voice Update */}
        <Route path="/projects/:projectId/voice-update" element={
          <PrivateRoute allowedRoles={['professor', 'student']}>
            <Layout><VoiceUpdatePage /></Layout>
          </PrivateRoute>
        } />

        {/* Predictive Analytics */}
        <Route path="/professor/analytics/predictive" element={
          <PrivateRoute allowedRoles={['professor']}>
            <Layout><PredictiveAnalyticsPage /></Layout>
          </PrivateRoute>
        } />

        {/* Default: landing page for guests, dashboard for authenticated users */}
        <Route path="/" element={
          user
            ? <Navigate to={user.role === 'professor' ? '/professor/dashboard' : '/student/dashboard'} replace />
            : <LandingPage />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
