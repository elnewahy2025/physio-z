import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
}

/**
 * Route guard component that checks user authentication and role
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">جارٍ التحقق...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

/** OWNER-only route guard */
export const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER']}>{children}</RouteGuard>
);

/** All managers + OWNER (BASIC feature access) */
export const ManagerBasicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER', 'MANAGER_BASIC', 'MANAGER_ADVANCED', 'MANAGER_PREMIUM']}>
    {children}
  </RouteGuard>
);

/** ADVANCED managers + OWNER */
export const ManagerAdvancedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER', 'MANAGER_ADVANCED', 'MANAGER_PREMIUM']}>
    {children}
  </RouteGuard>
);

/** PREMIUM managers + OWNER */
export const ManagerPremiumRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER', 'MANAGER_PREMIUM']}>
    {children}
  </RouteGuard>
);

/** Therapist and above route guard */
export const TherapistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER', 'THERAPIST']}>{children}</RouteGuard>
);

/** Staff route guard (OWNER, THERAPIST, SECRETARY + all managers) */
export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER', 'THERAPIST', 'SECRETARY', 'MANAGER_BASIC', 'MANAGER_ADVANCED', 'MANAGER_PREMIUM']}>
    {children}
  </RouteGuard>
);

/** Patient-accessible route guard */
export const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard allowedRoles={['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT']}>
    {children}
  </RouteGuard>
);

/**
 * Unauthorized page component
 */
export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          غير مصرح بالوصول
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          عذراً، لا تملك الصلاحية للوصول إلى هذه الصفحة.
        </p>
        
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          العودة للخلف
        </button>
      </div>
    </div>
  );
};

export default RouteGuard;
