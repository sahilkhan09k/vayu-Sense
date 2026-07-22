import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, type User } from './context/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ChangePassword } from './pages/ChangePassword';
import { Dashboard } from './pages/Dashboard';
import { MapPage } from './pages/MapPage';
import { CitizenHome } from './pages/CitizenHome';
import { CitizenProfile } from './pages/CitizenProfile';
import { CitizenCommute } from './pages/CitizenCommute';
import { CitizenReport } from './pages/CitizenReport';
import { HistoryPage } from './pages/HistoryPage';
import { ForecastPage } from './pages/ForecastPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { EnforcementPage } from './pages/EnforcementPage';
import { CitiesPage } from './pages/CitiesPage';
import { VulnerabilityPage } from './pages/VulnerabilityPage';
import { SettingsPage } from './pages/SettingsPage';
import { getHomeRoute } from './utils/authRoutes';

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      gap: '16px',
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 800,
        letterSpacing: '-0.02em',
      }}>
        <span style={{ color: 'var(--text-primary)' }}>Vayu</span>
        <span style={{ color: 'var(--accent-teal)', textShadow: 'var(--glow-teal)' }}>Sense</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
        <div className="loading-spinner" style={{ borderTopColor: 'var(--accent-teal)' }} />
        <span>Establishing secure terminal session...</span>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomeRoute(user)} replace />;
}

function ProtectedRoute({ children, allowTempPassword = false }: { children: React.ReactNode; allowTempPassword?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isCredentialGenerated && !user.tempPasswordChanged && !allowTempPassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: User['role'][];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isCredentialGenerated && !user.tempPasswordChanged) {
    return <Navigate to="/change-password" replace />;
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <>{children}</>;
}

import { CityProvider } from './context/CityContext';

function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />

            <Route
              path="/change-password"
              element={
                <ProtectedRoute allowTempPassword>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RoleRoute allowedRoles={['city_authority', 'state_authority']}>
                  <Dashboard />
                </RoleRoute>
              }
            />

            <Route
              path="/map"
              element={
                <RoleRoute allowedRoles={['city_authority', 'state_authority']}>
                  <MapPage />
                </RoleRoute>
              }
            />

            <Route
              path="/citizen"
              element={
                <RoleRoute allowedRoles={['citizen']}>
                  <CitizenHome />
                </RoleRoute>
              }
            />

            <Route
              path="/citizen/profile"
              element={
                <RoleRoute allowedRoles={['citizen']}>
                  <CitizenProfile />
                </RoleRoute>
              }
            />

            <Route
              path="/citizen/commute"
              element={
                <RoleRoute allowedRoles={['citizen']}>
                  <CitizenCommute />
                </RoleRoute>
              }
            />

            <Route
              path="/citizen/report"
              element={
                <RoleRoute allowedRoles={['citizen']}>
                  <CitizenReport />
                </RoleRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/forecast"
              element={
                <RoleRoute allowedRoles={['city_authority', 'state_authority']}>
                  <ForecastPage />
                </RoleRoute>
              }
            />

            <Route
              path="/accuracy"
              element={
                <RoleRoute allowedRoles={['city_authority', 'state_authority']}>
                  <AccuracyPage />
                </RoleRoute>
              }
            />

            <Route
              path="/enforcement"
              element={
                <RoleRoute allowedRoles={['city_authority', 'state_authority']}>
                  <EnforcementPage />
                </RoleRoute>
              }
            />

            <Route
              path="/cities"
              element={
                <RoleRoute allowedRoles={['state_authority']}>
                  <CitiesPage />
                </RoleRoute>
              }
            />

            <Route
              path="/vulnerability"
              element={
                <RoleRoute allowedRoles={['city_authority', 'state_authority']}>
                  <VulnerabilityPage />
                </RoleRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <RoleRoute allowedRoles={['state_authority']}>
                  <SettingsPage />
                </RoleRoute>
              }
            />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CityProvider>
    </AuthProvider>
  );
}

export default App;
