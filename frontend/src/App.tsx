// frontend/src/App.tsx
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { I18nProvider } from './i18n';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Sessions from './pages/Sessions';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Register from './pages/Register';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import PatientBooking from './pages/PatientBooking';
import MyRecords from './pages/MyRecords';
import MyPayments from './pages/MyPayments';
import CalendarPage from './pages/CalendarPage';
import ErrorBoundary from './components/ErrorBoundary';
import Packages from './pages/Packages';
import Waitlist from './pages/Waitlist';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Equipment from './pages/Equipment';
import EducationPortal from './pages/EducationPortal';

// Modules
import IntelligenceDashboard from './modules/intelligence/components/IntelligenceDashboard';
import DemandForecastDashboard from './modules/intelligence/components/DemandForecastDashboard';
import NoShowRiskDashboard from './modules/intelligence/components/NoShowRiskDashboard';
import TreatmentEffectivenessDashboard from './modules/intelligence/components/TreatmentEffectivenessDashboard';
import ExerciseLibrary from './modules/exercise-library/components/ExerciseLibrary';
import WhatsAppReminders from './modules/integrations/components/WhatsAppReminders';
import VideoConsultation from './modules/integrations/components/VideoConsultation';
import PaymentManagement from './modules/integrations/components/PaymentManagement';
import AuditLogDashboard from './modules/audit/components/AuditLogDashboard';
import BackupManagement from './modules/backup/components/BackupManagement';
import ProviderManagementDashboard from './modules/providers/components/ProviderManagementDashboard';
import ProtocolsLibrary from './modules/clinical/components/ProtocolsLibrary';
import AddonsHub from './pages/AddonsHub';
import FeatureRouteGuard from './components/FeatureRouteGuard';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function App() {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <OfflineIndicator />
        <InstallPrompt />

        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Register />
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
<Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
<Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
<Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
          <Route
            path="/my-payments"
            element={
              <ProtectedRoute>
                <MyPayments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <PatientBooking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-records"
            element={
              <ProtectedRoute>
                <MyRecords />
              </ProtectedRoute>
            }
          />
<Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
<Route path="/waitlist" element={<ProtectedRoute><Waitlist /></ProtectedRoute>} />
<Route path="/addons" element={<ProtectedRoute><AddonsHub /></ProtectedRoute>} />
<Route path="/intelligence" element={<ProtectedRoute><FeatureRouteGuard featureKey="intelligence"><IntelligenceDashboard /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/intelligence/demand" element={<ProtectedRoute><FeatureRouteGuard featureKey="intelligence"><DemandForecastDashboard /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/intelligence/no-show" element={<ProtectedRoute><FeatureRouteGuard featureKey="intelligence"><NoShowRiskDashboard /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/intelligence/treatment" element={<ProtectedRoute><FeatureRouteGuard featureKey="intelligence"><TreatmentEffectivenessDashboard /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/exercises" element={<ProtectedRoute><FeatureRouteGuard featureKey="exercises"><ExerciseLibrary /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/integrations/whatsapp" element={<ProtectedRoute><FeatureRouteGuard featureKey="whatsapp"><WhatsAppReminders /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/integrations/video" element={<ProtectedRoute><FeatureRouteGuard featureKey="video"><VideoConsultation /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/integrations/payments" element={<ProtectedRoute><FeatureRouteGuard featureKey="payments"><PaymentManagement /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/audit-logs" element={<ProtectedRoute><FeatureRouteGuard featureKey="audit"><AuditLogDashboard /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/backups" element={<ProtectedRoute><FeatureRouteGuard featureKey="backups"><BackupManagement /></FeatureRouteGuard></ProtectedRoute>} />
<Route path="/providers" element={<ProtectedRoute><ProviderManagementDashboard /></ProtectedRoute>} />
<Route path="/education" element={<ProtectedRoute><EducationPortal /></ProtectedRoute>} />
<Route path="/protocols" element={<ProtectedRoute><FeatureRouteGuard featureKey="protocols"><ProtocolsLibrary /></FeatureRouteGuard></ProtectedRoute>} />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;
