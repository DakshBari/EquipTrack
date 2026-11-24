import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EquipTrackProvider, useEquipTrack } from './context/EquipTrackContext';
import { LoginPage } from './pages/LoginPage';
import { AdminEquipmentPage } from './pages/admin/AdminEquipmentPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSitesPage } from './pages/admin/AdminSitesPage';
import { AdminTemplatesPage } from './pages/admin/AdminTemplatesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { MaintenanceFaultPage } from './pages/maintenance/MaintenanceFaultPage';
import { EquipmentDetailsPage } from './pages/operator/EquipmentDetailsPage';
import { OperatorEquipmentListPage } from './pages/operator/OperatorEquipmentListPage';
import { OperatorHistoryPage } from './pages/operator/OperatorHistoryPage';
import { OperatorHomePage } from './pages/operator/OperatorHomePage';
import { OperatorProfilePage } from './pages/operator/OperatorProfilePage';
import { OperatorQrScannerPage } from './pages/operator/OperatorQrScannerPage';
import { PreStartChecklistPage } from './pages/operator/PreStartChecklistPage';
import { DashboardProfilePage } from './pages/shared/ProfilePage';
import { ReportsPage } from './pages/shared/ReportsPage';
import { SupervisorEquipmentPage } from './pages/supervisor/SupervisorEquipmentPage';
import { SupervisorFaultDetailPage } from './pages/supervisor/SupervisorFaultDetailPage';
import { SupervisorFaultsPage } from './pages/supervisor/SupervisorFaultsPage';
import { SupervisorMaintenancePage } from './pages/supervisor/SupervisorMaintenancePage';
import { SupervisorNotificationsPage } from './pages/supervisor/SupervisorNotificationsPage';
import { SupervisorOverviewPage } from './pages/supervisor/SupervisorOverviewPage';
import { SupervisorPreStartsPage } from './pages/supervisor/SupervisorPreStartsPage';
import { UserRole } from './types';

function RequireRole({
  allowed,
  children,
}: {
  allowed?: UserRole[];
  children: React.ReactNode;
}) {
  const { currentUser } = useEquipTrack();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (allowed && !allowed.includes(currentUser.role)) {
    if (currentUser.role === 'operator') return <Navigate to="/operator" replace />;
    if (currentUser.role === 'supervisor') return <Navigate to="/supervisor" replace />;
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { currentUser } = useEquipTrack();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'operator') return <Navigate to="/operator" replace />;
  if (currentUser.role === 'supervisor') return <Navigate to="/supervisor" replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <EquipTrackProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Direct Contractor Maintenance Link (no login required) */}
          <Route path="/maintenance/fault/:faultId" element={<MaintenanceFaultPage />} />

          {/* Equipment QR Deep-Links (works cleanly for signed-in operators, or directs to operator flow) */}
          <Route
            path="/equipment/:equipmentId"
            element={
              <RequireRole>
                <EquipmentDetailsPage />
              </RequireRole>
            }
          />
          <Route
            path="/equipment/:equipmentId/prestart"
            element={
              <RequireRole>
                <PreStartChecklistPage />
              </RequireRole>
            }
          />

          {/* Operator Mobile App Routes */}
          <Route
            path="/operator"
            element={
              <RequireRole allowed={['operator', 'supervisor', 'admin']}>
                <OperatorHomePage />
              </RequireRole>
            }
          />
          <Route
            path="/operator/equipment"
            element={
              <RequireRole allowed={['operator', 'supervisor', 'admin']}>
                <OperatorEquipmentListPage />
              </RequireRole>
            }
          />
          <Route
            path="/operator/scan"
            element={
              <RequireRole allowed={['operator', 'supervisor', 'admin']}>
                <OperatorQrScannerPage />
              </RequireRole>
            }
          />
          <Route
            path="/operator/history"
            element={
              <RequireRole allowed={['operator', 'supervisor', 'admin']}>
                <OperatorHistoryPage />
              </RequireRole>
            }
          />
          <Route
            path="/operator/history/:inspectionId"
            element={
              <RequireRole allowed={['operator', 'supervisor', 'admin']}>
                <OperatorHistoryPage />
              </RequireRole>
            }
          />
          <Route
            path="/operator/profile"
            element={
              <RequireRole allowed={['operator', 'supervisor', 'admin']}>
                <OperatorProfilePage />
              </RequireRole>
            }
          />

          {/* Supervisor Dashboard Routes */}
          <Route
            path="/supervisor"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorOverviewPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/prestarts"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorPreStartsPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/faults"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorFaultsPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/faults/:faultId"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorFaultDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/equipment"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorEquipmentPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/equipment/:equipmentId"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorEquipmentPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/maintenance"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorMaintenancePage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/reports"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <ReportsPage mode="supervisor" />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/notifications"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <SupervisorNotificationsPage />
              </RequireRole>
            }
          />
          <Route
            path="/supervisor/profile"
            element={
              <RequireRole allowed={['supervisor', 'admin']}>
                <DashboardProfilePage mode="supervisor" />
              </RequireRole>
            }
          />

          {/* Company Admin Routes */}
          <Route
            path="/admin"
            element={
              <RequireRole allowed={['admin']}>
                <AdminOverviewPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/equipment"
            element={
              <RequireRole allowed={['admin']}>
                <AdminEquipmentPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole allowed={['admin']}>
                <AdminUsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/sites"
            element={
              <RequireRole allowed={['admin']}>
                <AdminSitesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <RequireRole allowed={['admin']}>
                <AdminTemplatesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/inspections"
            element={
              <RequireRole allowed={['admin']}>
                <SupervisorPreStartsPage adminMode />
              </RequireRole>
            }
          />
          <Route
            path="/admin/faults"
            element={
              <RequireRole allowed={['admin']}>
                <SupervisorFaultsPage adminMode />
              </RequireRole>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireRole allowed={['admin']}>
                <ReportsPage mode="admin" />
              </RequireRole>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireRole allowed={['admin']}>
                <AdminSettingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <RequireRole allowed={['admin']}>
                <DashboardProfilePage mode="admin" />
              </RequireRole>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EquipTrackProvider>
  );
}
