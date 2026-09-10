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
