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
  Activity,
  BarChart3,
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
  { key: 'sessions', icon: <Activity size={20} />, path: '/sessions', roles: ['OWNER', 'THERAPIST'] },
  { key: 'invoices', icon: <FileText size={20} />, path: '/invoices', roles: ['OWNER', 'SECRETARY', 'PATIENT'] },
  { key: 'reports', icon: <BarChart3 size={20} />, path: '/reports', roles: ['OWNER'] },
  { key: 'users', icon: <Users size={20} />, path: '/users', roles: ['OWNER'] },
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
              <span>{lang === 'ar' ? 'English' : 'ط§ظ„ط¹ط±ط¨ظٹط©'}</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}