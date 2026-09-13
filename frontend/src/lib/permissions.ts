// frontend/src/lib/permissions.ts
// Central permission helpers — mirrors backend auth middleware logic exactly.
// Use these to show/hide UI elements. Backend ALWAYS enforces the same rules.

import type { Role } from '../types';

// Cumulative role sets (same as backend constants)
export const ANY_MANAGER_OR_OWNER: Role[] = ['OWNER', 'MANAGER_PREMIUM', 'MANAGER_ADVANCED', 'MANAGER_BASIC'];
export const ADVANCED_MANAGER_OR_OWNER: Role[] = ['OWNER', 'MANAGER_PREMIUM', 'MANAGER_ADVANCED'];
export const PREMIUM_MANAGER_OR_OWNER: Role[] = ['OWNER', 'MANAGER_PREMIUM'];

/** Returns true if this role is any type of Manager */
export const isManager = (role: Role | null | undefined): boolean =>
  !!role && ['MANAGER_BASIC', 'MANAGER_ADVANCED', 'MANAGER_PREMIUM'].includes(role);

/** Returns true if role can access BASIC-level features (all managers + owner) */
export const canAccessBasic = (role: Role | null | undefined): boolean =>
  !!role && (ANY_MANAGER_OR_OWNER as string[]).includes(role);

/** Returns true if role can access ADVANCED-level features */
export const canAccessAdvanced = (role: Role | null | undefined): boolean =>
  !!role && (ADVANCED_MANAGER_OR_OWNER as string[]).includes(role);

/** Returns true if role can access PREMIUM-level features */
export const canAccessPremium = (role: Role | null | undefined): boolean =>
  !!role && (PREMIUM_MANAGER_OR_OWNER as string[]).includes(role);

/** Returns true if role is OWNER only */
export const isOwner = (role: Role | null | undefined): boolean => role === 'OWNER';

// Feature-level helpers (matching the approved feature matrix)
export const canAccessDashboard = (role: Role | null | undefined) => canAccessBasic(role) || role === 'THERAPIST' || role === 'SECRETARY';
export const canAccessCalendar = canAccessDashboard;
export const canAccessAppointments = canAccessDashboard;
export const canAccessPatients = canAccessDashboard;
export const canAccessSessions = (role: Role | null | undefined) => canAccessBasic(role) || role === 'THERAPIST';
export const canAccessInvoices = (role: Role | null | undefined) => canAccessBasic(role) || role === 'SECRETARY';
export const canAccessPackages = canAccessInvoices;
export const canAccessWaitlist = canAccessInvoices;
export const canAccessExpenses = canAccessAdvanced;
export const canAccessReports = canAccessAdvanced;
export const canAccessInventory = canAccessAdvanced;
export const canAccessEquipment = canAccessAdvanced;
export const canAccessSettings = (role: Role | null | undefined) => canAccessPremium(role);
export const canAccessAddons = canAccessSettings;
export const canAccessUsers = isOwner; // OWNER only
export const canAccessPayroll = canAccessAdvanced;
