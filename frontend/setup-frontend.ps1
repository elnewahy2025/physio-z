#Requires -Version 5.1
<#
.SYNOPSIS
    Physio Frontend - Phase 3 Setup
.DESCRIPTION
    Creates a complete React + Vite + TailwindCSS frontend with RTL Arabic support,
    role-based dashboards, and API integration with the backend.
#>

 $ErrorActionPreference = 'Stop'

function Save-File {
    param([string]$Path, [string]$Content)
    $Path = Join-Path $PSScriptRoot $Path
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Physio Frontend Setup (Phase 3) ===" -ForegroundColor Magenta
Write-Host ""

# ── 1. Create directories ──
Write-Host "[1/6] Creating directories..." -ForegroundColor Cyan
 $dirs = @("frontend\public", "frontend\src\lib", "frontend\src\store", "frontend\src\components", "frontend\src\pages")
foreach ($d in $dirs) { New-Item -Path $d -ItemType Directory -Force | Out-Null }
Write-Host "  OK" -ForegroundColor Green

# ── 2. Configuration files ──
Write-Host "[2/6] Creating configuration..." -ForegroundColor Cyan

 $pkgJson = @'
{
  "name": "@physio/frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.51.0",
    "axios": "^1.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.441.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "tailwind-merge": "^2.5.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
'@
Save-File "frontend\package.json" $pkgJson

 $viteConfig = @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
'@
Save-File "frontend\vite.config.ts" $viteConfig

 $tsConfig = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
'@
Save-File "frontend\tsconfig.json" $tsConfig

 $tailwindConfig = @'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Tahoma',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
'@
Save-File "frontend\tailwind.config.js" $tailwindConfig

 $postcssConfig = @'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@
Save-File "frontend\postcss.config.js" $postcssConfig

 $indexHtml = @'
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Physio Center Management System" />
    <title>Physio Center</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'@
Save-File "frontend\index.html" $indexHtml

 $favicon = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
</svg>
'@
Save-File "frontend\public\favicon.svg" $favicon

# ── 3. Core source files ──
Write-Host "[3/6] Creating core source..." -ForegroundColor Cyan

 $indexCss = @'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }

  html[dir='rtl'] body {
    font-family: 'Cairo', 'Inter', system-ui, sans-serif;
  }

  html[dir='ltr'] body {
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }

  .btn-secondary {
    @apply btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
  }

  .input {
    @apply block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500;
  }

  .label {
    @apply mb-1.5 block text-sm font-medium text-gray-700;
  }

  .card {
    @apply rounded-xl border border-gray-200 bg-white p-6 shadow-sm;
  }

  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
  }
}
'@
Save-File "frontend\src\index.css" $indexCss

 $typesTs = @'
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
'@
Save-File "frontend\src\types.ts" $typesTs

 $apiTs = @'
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
'@
Save-File "frontend\src\lib\api.ts" $apiTs

 $authStore = @'
import { create } from 'zustand';
import api from '../lib/api';
import type { AuthUser, LoginResponse } from '../types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (identifier: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        identifier,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false, error: null });
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'An error occurred. Please try again.';
      set({ isLoading: false, error: message, isAuthenticated: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null });
    window.location.href = '/login';
  },

  initialize: () => {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        set({ user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  },
}));
'@
Save-File "frontend\src\store\auth.ts" $authStore

 $i18nTs = @'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'ar' | 'en';

const translations = {
  ar: {
    // App
    appName: 'مركز العلاج الطبيعي',
    welcome: 'مرحباً',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    phoneOrEmail: 'رقم الهاتف أو البريد الإلكتروني',
    forgotPassword: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    invalidCredentials: 'بيانات الدخول غير صحيحة',

    // Navigation
    dashboard: 'لوحة التحكم',
    patients: 'المرضى',
    appointments: 'المواعيد',
    invoices: 'الفواتير',
    payments: 'المدفوعات',
    sessions: 'الجلسات',
    users: 'المستخدمون',
    settings: 'الإعدادات',
    rooms: 'الغرف',
    reports: 'التقارير',

    // Dashboard
    todaysAppointments: 'مواعيد اليوم',
    totalPatients: 'إجمالي المرضى',
    totalRevenue: 'إجمالي الإيرادات',
    pendingInvoices: 'فواتير معلقة',
    upcomingAppointments: 'المواعيد القادمة',
    recentPayments: 'المدفوعات الأخيرة',
    mySchedule: 'جدولي',
    nextAppointment: 'موعدك القادم',
    treatmentHistory: 'سجل العلاج',

    // Status
    confirmed: 'مؤكد',
    pending: 'معلق',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    noShow: 'لم يحضر',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    partiallyPaid: 'مدفوع جزئياً',
    overdue: 'متأخر',

    // Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    print: 'طباعة',
    viewAll: 'عرض الكل',
    noData: 'لا توجد بيانات',

    // Language
    arabic: 'العربية',
    english: 'English',
  },
  en: {
    appName: 'Physio Center',
    welcome: 'Welcome',
    logout: 'Logout',
    login: 'Login',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    phoneOrEmail: 'Phone or Email',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign In',
    loading: 'Loading...',
    error: 'Error',
    invalidCredentials: 'Invalid credentials',

    dashboard: 'Dashboard',
    patients: 'Patients',
    appointments: 'Appointments',
    invoices: 'Invoices',
    payments: 'Payments',
    sessions: 'Sessions',
    users: 'Users',
    settings: 'Settings',
    rooms: 'Rooms',
    reports: 'Reports',

    todaysAppointments: "Today's Appointments",
    totalPatients: 'Total Patients',
    totalRevenue: 'Total Revenue',
    pendingInvoices: 'Pending Invoices',
    upcomingAppointments: 'Upcoming Appointments',
    recentPayments: 'Recent Payments',
    mySchedule: 'My Schedule',
    nextAppointment: 'Your Next Appointment',
    treatmentHistory: 'Treatment History',

    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partiallyPaid: 'Partially Paid',
    overdue: 'Overdue',

    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    viewAll: 'View All',
    noData: 'No data',

    arabic: 'العربية',
    english: 'English',
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

interface I18nContextType {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey) => {
    return translations[lang][key] ?? key;
  };

  return (
    <I18nContext.Provider
      value={{ lang, t, setLang, isRTL: lang === 'ar' }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
'@
Save-File "frontend\src\i18n.ts" $i18nTs

# ── 4. UI Components ──
Write-Host "[4/6] Creating UI components..." -ForegroundColor Cyan

 $uiComponents = @'
import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: clsx.ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Card ──
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Stat Card ──
export function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'primary' | 'green' | 'yellow' | 'red';
  trend?: string;
}) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-gray-400">{trend}</p>}
        </div>
        {icon && (
          <div className={cn('rounded-lg p-3', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Badge ──
const badgeColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
  UNPAID: 'bg-red-100 text-red-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span className={cn('badge', badgeColors[status] || 'bg-gray-100 text-gray-800')}>
      {children ?? status}
    </span>
  );
}

// ── Empty State ──
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        className="h-12 w-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ── Spinner ──
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
    </div>
  );
}
'@
Save-File "frontend\src\components\ui.tsx" $uiComponents

# ── 5. Layout ──
Write-Host "[5/6] Creating layout..." -ForegroundColor Cyan

 $appLayout = @'
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Languages,
  Stethoscope,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';
import { cn } from './ui';

interface NavItem {
  key: string;
  icon: ReactNode;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', icon: <LayoutDashboard size={20} />, path: '/', roles: ['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'] },
  { key: 'appointments', icon: <Calendar size={20} />, path: '/appointments', roles: ['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'] },
  { key: 'patients', icon: <Users size={20} />, path: '/patients', roles: ['OWNER', 'THERAPIST', 'SECRETARY'] },
  { key: 'invoices', icon: <FileText size={20} />, path: '/invoices', roles: ['OWNER', 'SECRETARY', 'PATIENT'] },
  { key: 'settings', icon: <Settings size={20} />, path: '/settings', roles: ['OWNER'] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="fixed inset-y-0 start-0 z-50 w-64 border-e border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{t('appName')}</h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              {item.icon}
              <span>{t(item.key as any)}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="ps-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('welcome')}, {user.name}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <Languages size={16} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
'@
Save-File "frontend\src\components\AppLayout.tsx" $appLayout

# ── 6. Pages ──
Write-Host "[6/6] Creating pages..." -ForegroundColor Cyan

 $loginPage = @'
import { type FormEvent } from 'react';
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError(t('invalidCredentials'));
      return;
    }

    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || t('invalidCredentials');
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 end-6 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
      >
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
            <Stethoscope size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('appName')}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {lang === 'ar' ? 'سجل الدخول إلى حسابك' : 'Sign in to your account'}
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="label">
                {t('phoneOrEmail')}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={lang === 'ar' ? '01xxxxxxxxx' : '01xxxxxxxxx or email'}
                className="input"
                autoComplete="username"
                required
                dir="ltr"
                style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pe-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('loading')}
                </span>
              ) : (
                t('signIn')
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          {lang === 'ar' ? 'مركز العلاج الطبيعي' : 'Physio Center'} © 2026
        </p>
      </div>
    </div>
  );
}
'@
Save-File "frontend\src\pages\Login.tsx" $loginPage

 $dashboardPage = @'
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';
import { StatCard, Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import type { Appointment, Invoice, Patient } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { t, lang } = useI18n();

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/appointments', {
        params: { date: today, limit: 10 },
      });
      return res.data.data as Appointment[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 1 } });
      return res.data.pagination.total as number;
    },
    enabled: user?.role !== 'PATIENT',
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', 'recent'],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { limit: 5 } });
      return res.data.data as Invoice[];
    },
    enabled: user?.role === 'OWNER' || user?.role === 'SECRETARY',
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
    enabled: user?.role === 'OWNER' || user?.role === 'SECRETARY',
  });

  if (apptLoading) {
    return <Spinner className="py-24" />;
  }

  const todayAppointments = appointments || [];
  const totalPatients = patients || 0;
  const currency = settings?.currency || 'EGP';

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
    PAID: t('paid'),
    UNPAID: t('unpaid'),
    PARTIALLY_PAID: t('partiallyPaid'),
    OVERDUE: t('overdue'),
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('todaysAppointments')}
          value={todayAppointments.length}
          icon={<Calendar size={24} />}
          color="primary"
        />
        {user?.role !== 'PATIENT' && (
          <StatCard
            title={t('totalPatients')}
            value={totalPatients}
            icon={<Users size={24} />}
            color="green"
          />
        )}
        {user?.role !== 'PATIENT' && (
          <StatCard
            title={t('pendingInvoices')}
            value={
              (invoices || []).filter((inv) => inv.status !== 'PAID').length
            }
            icon={<FileText size={24} />}
            color="yellow"
          />
        )}
        <StatCard
          title={t('upcomingAppointments')}
          value={
            todayAppointments.filter(
              (a) => a.status === 'PENDING' || a.status === 'CONFIRMED',
            ).length
          }
          icon={<Clock size={24} />}
          color="primary"
        />
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader
          title={t('todaysAppointments')}
          subtitle={`${todayAppointments.length} ${lang === 'ar' ? 'موعد' : 'appointments'}`}
        />
        {todayAppointments.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appt.patient.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(appt.dateTime)} · {appt.therapist.name}
                      {appt.room && ` · ${t('rooms')} ${appt.room.number}`}
                    </p>
                  </div>
                </div>
                <Badge status={appt.status}>
                  {statusLabels[appt.status] || appt.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Invoices (Owner/Secretary only) */}
      {(user?.role === 'OWNER' || user?.role === 'SECRETARY') && (
        <Card>
          <CardHeader
            title={t('recentPayments')}
            subtitle={`${(invoices || []).length} ${lang === 'ar' ? 'فواتير' : 'invoices'}`}
          />
          {(invoices || []).length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices!.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inv.number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {inv.patient.name} · {formatDate(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(inv.total).toFixed(0)} {currency}
                    </span>
                    <Badge status={inv.status}>
                      {statusLabels[inv.status] || inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
'@
Save-File "frontend\src\pages\Dashboard.tsx" $dashboardPage

# ── App entry points ──
 $mainTsx = @'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
'@
Save-File "frontend\src\main.tsx" $mainTsx

 $appTsx = @'
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { I18nProvider } from './i18n';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

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
    <I18nProvider>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </I18nProvider>
  );
}

export default App;
'@
Save-File "frontend\src\App.tsx" $appTsx

# ── 7. Install and start ──
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan

Push-Location (Join-Path $PSScriptRoot "frontend")

 $prevEAP = $ErrorActionPreference
 $ErrorActionPreference = 'Continue'

 $installOutput = pnpm install 2>&1 | Out-String
 $installExit = $LASTEXITCODE

 $ErrorActionPreference = $prevEAP

if ($installExit -ne 0) {
    # Check if it's just the build scripts warning
    if ($installOutput -match "approve-builds") {
        Write-Host "  Approving build scripts..." -ForegroundColor Yellow
        $ErrorActionPreference = 'Continue'
        pnpm approve-builds 2>&1 | Out-Null
        pnpm install 2>&1 | Out-Null
        $ErrorActionPreference = $prevEAP
    } else {
        Write-Host "  Install FAILED" -ForegroundColor Red
        Write-Host $installOutput
        Pop-Location
        exit 1
    }
}
Write-Host "  Dependencies installed" -ForegroundColor Green
Pop-Location

# ── Summary ──
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Phase 3 Frontend COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To start the frontend dev server:" -ForegroundColor Cyan
Write-Host "    cd frontend"
Write-Host "    pnpm dev"
Write-Host ""
Write-Host "  Then open: http://localhost:5173"
Write-Host ""
Write-Host "  IMPORTANT: Keep the backend running too!"
Write-Host "    cd backend && pnpm dev   (in another terminal)"
Write-Host ""
Write-Host "  Login credentials:"
Write-Host "    Phone: 01000000000"
Write-Host "    Password: ChangeMe123!"
Write-Host ""
Write-Host "  Features included:"
Write-Host "    - Login page (AR/EN with RTL)"
Write-Host "    - Role-based sidebar navigation"
Write-Host "    - Dashboard with live API data"
Write-Host "    - JWT auth with auto-refresh"
Write-Host "    - Language toggle (Arabic RTL / English LTR)"
Write-Host ""