export const ROLES = ['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'] as const;
export type Role = (typeof ROLES)[number];
export const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const INVOICE_STATUSES = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export interface AuthUser { id: string; name: string; phone: string; email: string | null; role: Role; }
export interface LoginResponse { user: AuthUser; accessToken: string; refreshToken: string; }
export interface RefreshResponse { accessToken: string; refreshToken: string; }
export interface ApiError { message: string; errors?: Record<string, string[] | undefined>; }