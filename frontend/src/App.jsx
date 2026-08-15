/**
 * App Component - Root Application Router
 * 
 * Defines all routes and layouts for the GovConnect platform.
 * Uses React Router v6 with nested layouts:
 * - Public routes: Landing, Login, Register, ForgotPassword, ResetPassword
 * - Protected routes: Dashboard, Complaints, Schemes, Notifications, Profile
 * - 404 catch-all
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

/* ----- Layout Components ----- */
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import LoadingSpinner from './components/layout/LoadingSpinner.jsx';

/* ----- Public Pages ----- */
import Landing from './pages/Landing/Landing.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import NewsDetail from './pages/News/NewsDetail.jsx';

/* ----- Protected Pages ----- */
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ComplaintList from './pages/Complaint/ComplaintList.jsx';
import MyComplaints from './pages/Complaint/MyComplaints.jsx';
import CreateComplaint from './pages/Complaint/CreateComplaint.jsx';
import ComplaintDetail from './pages/Complaint/ComplaintDetail.jsx';
import EditComplaint from './pages/Complaint/EditComplaint.jsx';
import GovernmentSchemes from './pages/GovernmentSchemes/GovernmentSchemes.jsx';
import SchemeDetail from './pages/GovernmentSchemes/SchemeDetail.jsx';
import { useState } from 'react';
import Notifications from './pages/Notifications/Notifications.jsx';
import Profile from './pages/Profile/Profile.jsx';
import CivicBudgeting from './pages/Budgeting/CivicBudgeting.jsx';
import FloatingAIAssistant from './components/layout/FloatingAIAssistant.jsx';

/**
 * PublicLayout - Layout wrapper for public pages (no sidebar)
 * Shows Navbar and Footer
 */
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer variant="brown" />
    </div>
  );
}

/**
 * DashboardLayout - Layout wrapper for authenticated pages
 * Shows Navbar, Sidebar, and main content area
 */
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="dashboard-layout-bg min-h-screen flex flex-col overflow-x-hidden">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 relative min-h-0">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col justify-between">
          <div className="flex-1">
            <ProtectedRoute />
          </div>
          <Footer variant="dashboard" />
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
}

/**
 * App - Root component with all application routes
 */
function App() {
  const { loading } = useAuth();

  // Show loading spinner while checking authentication status
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <Routes>
      {/* ===== Public Routes ===== */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Landing />
          </PublicLayout>
        }
      />
      <Route
        path="/news/:id"
        element={
          <PublicLayout>
            <NewsDetail />
          </PublicLayout>
        }
      />
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/register"
        element={<Register />}
      />
      <Route
        path="/forgot-password"
        element={
          <PublicLayout>
            <ForgotPassword />
          </PublicLayout>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicLayout>
            <ResetPassword />
          </PublicLayout>
        }
      />

      {/* ===== Protected Routes (Dashboard Layout) ===== */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/civic-budgeting" element={<CivicBudgeting />} />
        <Route path="/complaints" element={<ComplaintList />} />
        <Route path="/complaints/create" element={<CreateComplaint />} />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
        <Route path="/complaints/:id/edit" element={<EditComplaint />} />
        <Route path="/my-complaints" element={<MyComplaints />} />
        <Route path="/schemes" element={<GovernmentSchemes />} />
        <Route path="/schemes/:id" element={<SchemeDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* ===== 404 Catch All ===== */}
      <Route
        path="*"
        element={
          <PublicLayout>
            <NotFound />
          </PublicLayout>
        }
      />
    </Routes>
  );
}

export default App;
