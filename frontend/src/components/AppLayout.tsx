import { type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Languages,
  Stethoscope,
  Activity,
  BarChart3,
  CalendarPlus,
  Moon,
  Sun,
} from 'lucide-react';

import NotificationBell from './NotificationBell';
import NotificationToast from './NotificationToast';

import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';
import { cn } from './ui';
import { useDarkMode } from '../hooks/useDarkMode';

interface NavItem {
  key: string;
  icon: ReactNode;
  path: string;
  roles: string[];
}

/**
 * Navigation labels that require a custom label instead of
 * relying directly on the i18n translation key.
 */
const navLabels: Record<string, { en: string; ar: string }> = {
  myRecords: {
    en: 'My Records',
    ar: 'سجلي الطبي',
  },
  book: {
    en: 'Book Appointment',
    ar: 'حجز موعد',
  },
};

const navItems: NavItem[] = [
  { key: 'dashboard', icon: <LayoutDashboard size={20} />, path: '/', roles: ['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'] },
  { key: 'calendar', icon: <CalendarDays size={20} />, path: '/calendar', roles: ['OWNER', 'THERAPIST', 'SECRETARY'] }, // NEW
  { key: 'book', icon: <CalendarPlus size={20} />, path: '/book', roles: ['PATIENT'] },
  { key: 'appointments', icon: <Calendar size={20} />, path: '/appointments', roles: ['OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'] },
  { key: 'myRecords', icon: <FileText size={20} />, path: '/my-records', roles: ['PATIENT'] },
  { key: 'myPayments', icon: <CreditCard size={20} />, path: '/my-payments', roles: ['PATIENT'] }, // NEW
  { key: 'patients', icon: <Users size={20} />, path: '/patients', roles: ['OWNER', 'THERAPIST', 'SECRETARY'] },
  { key: 'sessions', icon: <Activity size={20} />, path: '/sessions', roles: ['OWNER', 'THERAPIST'] },
  { key: 'invoices', icon: <FileText size={20} />, path: '/invoices', roles: ['OWNER', 'SECRETARY'] },
  { key: 'reports', icon: <BarChart3 size={20} />, path: '/reports', roles: ['OWNER'] },
  { key: 'users', icon: <Users size={20} />, path: '/users', roles: ['OWNER'] },
  { key: 'settings', icon: <Settings size={20} />, path: '/settings', roles: ['OWNER'] },
];
export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const { isDark, toggle } = useDarkMode();

  const navigate = useNavigate();
  const location = useLocation();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/settings');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!user) {
    return null;
  }

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role),
  );

  /**
   * Returns the correct navigation label.
   *
   * Custom labels:
   * - myRecords -> My Records / سجلي الطبي
   * - book -> Book Appointment / حجز موعد
   *
   * All other navigation items continue to use
   * the existing i18n translation system.
   */
  const getNavLabel = (key: string) => {
    const customLabel = navLabels[key];

    if (customLabel) {
      return lang === 'ar' ? customLabel.ar : customLabel.en;
    }

    return t(key as any);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Sidebar */}
      <aside className="fixed inset-y-0 start-0 z-50 w-64 border-e border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Logo / Center Name */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6 dark:border-gray-700">
          {settings?.centerLogo ? (
            <img
              src={settings.centerLogo}
              alt={settings.centerName || t('appName')}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Stethoscope size={24} />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {settings?.centerName || t('appName')}
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100',
                )}
              >
                {item.icon}

                <span>{getNavLabel(item.key)}</span>
              </button>
            );
          })}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.name}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur dark:border-gray-700 dark:bg-gray-800/80">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('welcome')}, {user.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              title={isDark ? 'Light mode' : 'Dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} className="text-gray-500" />
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label={
                lang === 'ar'
                  ? 'Switch to English'
                  : 'التبديل إلى العربية'
              }
            >
              <Languages size={16} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <NotificationToast />
          {children}
        </main>
      </div>
    </div>
  );
}


