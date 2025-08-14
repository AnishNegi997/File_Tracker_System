import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateFile from './pages/CreateFile';
import Logs from './pages/Logs';
import Track from './pages/Track';
import BarcodeScanner from './pages/BarcodeScanner';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDirectory from './pages/EmployeeDirectory';
import MyProfile from './pages/MyProfile';
import FileDetails from './pages/FileDetails';
import Notifications from './pages/Notifications';
import AuditLog from './pages/AuditLog';

import AccessDenied from './pages/AccessDenied';
import DepartmentFiles from './pages/DepartmentFiles';
import MyFiles from './pages/MyFiles';
import ReceivedFiles from './pages/ReceivedFiles';
import AllFiles from './pages/AllFiles';
import UserManagement from './pages/UserManagement';
import IncomingFiles from './pages/IncomingFiles';
import SendForwardFile from './pages/SendForwardFile';
import SentFiles from './pages/SentFiles';
import EmailTest from './pages/EmailTest';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';

function AppLayout() {
  const { user } = useAuth();
  
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incoming-files" element={<IncomingFiles />} />
          <Route path="/received-files" element={<ReceivedFiles />} />
          <Route path="/sent-files" element={<SentFiles />} />
          <Route path="/all-files" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <AllFiles /> : <AccessDenied />} />

          <Route path="/create" element={<CreateFile />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/track" element={<Track />} />
          <Route path="/scanner" element={<BarcodeScanner />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/user-management" element={user && (user.role === 'superadmin' || user.role === 'admin') ? <UserManagement /> : <AccessDenied />} />
          <Route path="/employee-directory" element={user && (user.role === 'superadmin' || user.role === 'admin') ? <EmployeeDirectory /> : <AccessDenied />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/file-details" element={<FileDetails />} />
          <Route path="/send-forward" element={<SendForwardFile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit-log" element={user && (user.role === 'superadmin' || user.role === 'auditor') ? <AuditLog /> : <AccessDenied />} />
          <Route path="/email-test" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <EmailTest /> : <AccessDenied />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/department-files" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <DepartmentFiles /> : <AccessDenied />} />
          <Route path="/my-files" element={user ? <MyFiles /> : <AccessDenied />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // If not logged in, always show login/signup
  if (!user && location.pathname !== '/login' && location.pathname !== '/signup') {
    return <Navigate to="/login" replace />;
  }

  // If logged in and on login/signup, redirect to dashboard
  if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname === '/login' || location.pathname === '/signup') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    );
  }

  // Otherwise, show the main app
  return <AppLayout />;
}

export default function AppWithProviders() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <App />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
