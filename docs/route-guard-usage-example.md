
## How to Use Route Guards in Your App.tsx:

```tsx
import { RouteGuard, OwnerRoute, TherapistRoute, StaffRoute, PatientRoute, UnauthorizedPage } from './components/RouteGuard';

// In your router:
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  {/* Protected routes with role checking */}
  <Route path="/dashboard" element={
    <StaffRoute>
      <DashboardPage />
    </StaffRoute>
  } />
  
  {/* Patient management (staff only) */}
  <Route path="/patients" element={
    <StaffRoute>
      <PatientListPage />
    </StaffRoute>
  } />
  
  {/* Intelligence (OWNER + THERAPIST only) */}
  <Route path="/intelligence" element={
    <TherapistRoute>
      <IntelligenceDashboard />
    </TherapistRoute>
  } />
  
  {/* Provider management (OWNER only) */}
  <Route path="/settings/providers" element={
    <OwnerRoute>
      <ProviderManagementPage />
    </OwnerRoute>
  } />
  
  {/* Patient's own prescriptions */}
  <Route path="/my-prescriptions" element={
    <PatientRoute>
      <MyPrescriptionsPage />
    </PatientRoute>
  } />
  
  {/* Unauthorized page */}
  <Route path="/unauthorized" element={<UnauthorizedPage />} />
</Routes>
```
