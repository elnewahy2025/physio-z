// frontend/src/components/EmptyStates.tsx
// Enhanced empty state components with illustrations and actions.

import type { ReactNode } from 'react';
import {
  Calendar,
  Users,
  FileText,
  Activity,
  CreditCard,
  BarChart3,
  Search,
  Plus,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EnhancedEmptyState({
  icon,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Illustration container */}
      <div className="relative mb-6">
        {/* Background circle */}
        <div className="absolute inset-0 -m-4 rounded-full bg-gray-100 dark:bg-gray-700/50" />

        {/* Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {icon || <Search size={28} />}
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── Specific empty states ───

export function NoAppointments({ onAdd }: { onAdd?: () => void }) {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<Calendar size={28} />}
      title={isRTL ? 'لا توجد مواعيد' : 'No Appointments'}
      subtitle={
        isRTL
          ? 'لم يتم جدولة أي مواعيد بعد. أضف موعدك الأول.'
          : "No appointments scheduled yet. Book your first appointment."
      }
      action={
        onAdd && (
          <button onClick={onAdd} className="btn-primary">
            <Plus size={16} />
            {isRTL ? 'موعد جديد' : 'New Appointment'}
          </button>
        )
      }
    />
  );
}

export function NoPatients({ onAdd }: { onAdd?: () => void }) {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<Users size={28} />}
      title={isRTL ? 'لا يوجد مرضى' : 'No Patients'}
      subtitle={
        isRTL
          ? 'لم يتم تسجيل أي مرضى بعد. أضف مريضك الأول.'
          : 'No patients registered yet. Add your first patient.'
      }
      action={
        onAdd && (
          <button onClick={onAdd} className="btn-primary">
            <Plus size={16} />
            {isRTL ? 'إضافة مريض' : 'Add Patient'}
          </button>
        )
      }
    />
  );
}

export function NoInvoices({ onCreate }: { onCreate?: () => void }) {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<FileText size={28} />}
      title={isRTL ? 'لا توجد فواتير' : 'No Invoices'}
      subtitle={
        isRTL
          ? 'لم يتم إنشاء أي فواتير بعد.'
          : 'No invoices created yet.'
      }
      action={
        onCreate && (
          <button onClick={onCreate} className="btn-primary">
            <Plus size={16} />
            {isRTL ? 'فاتورة جديدة' : 'New Invoice'}
          </button>
        )
      }
    />
  );
}

export function NoSessions() {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<Activity size={28} />}
      title={isRTL ? 'لا توجد جلسات' : 'No Sessions'}
      subtitle={
        isRTL
          ? 'أكمل موعداً ثم أضف ملاحظات الجلسة.'
          : 'Complete an appointment then add session notes.'
      }
    />
  );
}

export function NoPayments() {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<CreditCard size={28} />}
      title={isRTL ? 'لا توجد مدفوعات' : 'No Payments'}
      subtitle={
        isRTL
          ? 'لم يتم تسجيل أي مدفوعات بعد.'
          : 'No payments recorded yet.'
      }
    />
  );
}

export function NoReports() {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<BarChart3 size={28} />}
      title={isRTL ? 'لا توجد بيانات' : 'No Data'}
      subtitle={
        isRTL
          ? 'لا توجد بيانات كافية لإنشاء التقارير.'
          : 'Not enough data to generate reports yet.'
      }
    />
  );
}

export function NoResults({ searchQuery }: { searchQuery?: string }) {
  const isRTL = document.documentElement.dir === 'rtl';

  return (
    <EnhancedEmptyState
      icon={<Search size={28} />}
      title={isRTL ? 'لا توجد نتائج' : 'No Results'}
      subtitle={
        searchQuery
          ? isRTL
            ? `لم يتم العثور على نتائج لـ "${searchQuery}"`
            : `No results found for "${searchQuery}"`
          : isRTL
            ? 'حاول تغيير معايير البحث.'
            : 'Try adjusting your search criteria.'
      }
    />
  );
}