import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

// Landing page
import LandingPage from './pages/LandingPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Professor pages
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import CreateProjectPage from './pages/professor/CreateProjectPage';
import ProjectDetailPage from './pages/professor/ProjectDetailPage';
import ProjectAnalyticsPage from './pages/professor/ProjectAnalyticsPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import JoinProjectPage from './pages/student/JoinProjectPage';
import SubmitUpdatePage from './pages/student/SubmitUpdatePage';
import StudentProjectDetailPage from './pages/student/StudentProjectDetailPage';

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

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner text="Loading…" />;

  return (
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

      {/* Default: landing page for guests, dashboard for authenticated users */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'professor' ? '/professor/dashboard' : '/student/dashboard'} replace />
          : <LandingPage />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
