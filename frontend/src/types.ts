export type Role = 'OWNER' | 'THERAPIST' | 'SECRETARY' | 'PATIENT';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  _count?: {
    appointments: number;
    invoices: number;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  roomId: string | null;
  dateTime: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes: string | null;
  patient: { id: string; name: string; phone: string };
  therapist: { id: string; name: string };
  room: { id: string; number: number; name: string } | null;
}

export interface Invoice {
  id: string;
  number: string;
  patientId: string;
  appointmentId: string | null;
  amount: number;
  tax: number;
  total: number;
  dueDate: string | null;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentMethod: string | null;
  createdAt: string;
  patient: { id: string; name: string; phone: string };
  payments: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: string;
  paymentDate: string;
}

export interface Room {
  id: string;
  number: number;
  name: string;
  _count?: { appointments: number };
}

export interface Settings {
  id: string;
  centerName: string;
  centerLogo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  googleMapsLink: string | null;
  sessionPrice: number;
  currency: string;
  taxRate: number;
  defaultLanguage: string;
  whatsappMessageTemplate: string | null;
}