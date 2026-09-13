import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePatientAuth } from '../store/patient-auth';

export default function PatientProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { patient } = usePatientAuth();

  if (!patient) {
    return <Navigate to="/portal/login" replace />;
  }

  // In React Router v6, layout routes don't receive `children`, they use `<Outlet />`.
  // If it's used as a wrapper component, it will have `children`.
  return children ? <>{children}</> : <Outlet />;
}
