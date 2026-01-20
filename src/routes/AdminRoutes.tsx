import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { RoutesManagement } from '@/pages/admin/RoutesManagement';
import { AddressesManagement } from '@/pages/admin/AddressesManagement';
import { EmployeesManagement } from '@/pages/admin/EmployeesManagement';
import { Statistics } from '@/pages/admin/Statistics';
import { Settings } from '@/pages/admin/Settings';
import { IssuesManagement } from '@/pages/admin/IssuesManagement';
import { RouteEditor } from '@/pages/admin/RouteEditor';
import { DailyStats } from '@/pages/admin/DailyStats';
import { AddressesImport } from '@/pages/admin/AddressesImport';

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredPermissions={['VIEW_STATISTICS', 'MANAGE_ROUTES']} requireAll={false}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/routes"
        element={
          <ProtectedRoute requiredPermission="MANAGE_ROUTES">
            <RoutesManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/routes/new"
        element={
          <ProtectedRoute requiredPermission="MANAGE_ROUTES">
            <RouteEditor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/routes/:routeId/edit"
        element={
          <ProtectedRoute requiredPermission="MANAGE_ROUTES">
            <RouteEditor />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/addresses"
        element={
          <ProtectedRoute requiredPermission="MANAGE_ADDRESSES">
            <AddressesManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/import"
        element={
          <ProtectedRoute requiredPermission="MANAGE_ADDRESSES">
            <AddressesImport />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/employees"
        element={
          <ProtectedRoute requiredPermission="MANAGE_USERS">
            <EmployeesManagement />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/statistics"
        element={
          <ProtectedRoute requiredPermission="VIEW_STATISTICS">
            <Statistics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily-stats"
        element={
          <ProtectedRoute requiredPermission="VIEW_STATISTICS">
            <DailyStats />
          </ProtectedRoute>
        }
      />

      <Route
        path="/issues"
        element={
          <ProtectedRoute requiredPermission="MANAGE_ADDRESSES">
            <IssuesManagement />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredPermission="MANAGE_SETTINGS">
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
