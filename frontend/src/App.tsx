import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard'; // Removed .tsx extension for consistency
import Departments from './pages/Departments';
import Profile from './pages/Profile';
import AdminAttendance from './pages/AdminAttendance';
import AdminLeaves from './pages/AdminLeaves';
import AdminPayroll from './pages/AdminPayroll';
import EmployeePayroll from './pages/EmployeePayroll';
import EmployeeDetails from './pages/EmployeeDetails';
import AdminPerformance from './pages/AdminPerformance';
import EmployeePerformance from './pages/EmployeePerformance';

// --- GUARD 1: PROTECT PRIVATE ROUTES (Dashboard, Profile, etc.) ---
// If NOT logged in -> Go to Login
const PrivateRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || '';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If the user's role is not authorized for this page:
  if (!allowedRoles.includes(role)) {
    const isUserAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
    return <Navigate to={isUserAdmin ? "/admin-dashboard" : "/employee-dashboard"} replace />;
  }

  return children;
};

// --- GUARD 2: PROTECT PUBLIC ROUTES (Login) ---
// If ALREADY logged in -> Go to Dashboard (Don't show login page)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (token && role) {
    const isUserAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
    return <Navigate to={isUserAdmin ? "/admin-dashboard" : "/employee-dashboard"} replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* WRAP LOGIN IN PUBLIC ROUTE */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Redirect Root to Login (which will then redirect to Dashboard if logged in) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* --- ADMIN AREA --- */}
        <Route 
          path="/admin-dashboard" 
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/departments" 
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <Departments />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/attendance-admin" 
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <AdminAttendance />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/leaves-admin" 
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <AdminLeaves />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/payroll-admin" 
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <AdminPayroll />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/employee/:id" 
          element={
            <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <EmployeeDetails />
            </PrivateRoute>
          } 
        />
        <Route 
            path="/performance-admin" 
            element={
              <PrivateRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
                <AdminPerformance />
              </PrivateRoute>
            } 
          />

        {/* --- EMPLOYEE AREA --- */}
        <Route 
          path="/employee-dashboard" 
          element={
            <PrivateRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeDashboard />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <PrivateRoute allowedRoles={['EMPLOYEE']}>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/my-payroll" 
          element={
            <PrivateRoute allowedRoles={['EMPLOYEE']}>
              <EmployeePayroll />
            </PrivateRoute>
          } 
        />
        <Route 
  path="/my-performance" 
  element={
    <PrivateRoute allowedRoles={['EMPLOYEE']}>
      <EmployeePerformance />
    </PrivateRoute>
  } 
/>

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;