import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteSelection } from '@/pages/driver/RouteSelection';
import { AddressList } from '@/pages/driver/AddressList';
import { CollectionView } from '@/pages/driver/CollectionView';
import { DailySummary } from '@/pages/driver/DailySummary';

export const DriverRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to="/driver/routes" replace />
        }
      />
      
      <Route
        path="/routes"
        element={
          <ProtectedRoute requiredPermission="VIEW_ROUTES">
            <RouteSelection />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/route/:routeId"
        element={
          <ProtectedRoute requiredPermission="VIEW_ROUTES">
            <AddressList />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/collect/:routeId/:addressId"
        element={
          <ProtectedRoute requiredPermission="COLLECT_WASTE">
            <CollectionView />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/summary"
        element={
          <ProtectedRoute requiredPermission="VIEW_ROUTES">
            <DailySummary />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
