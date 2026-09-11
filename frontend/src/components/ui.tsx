import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: clsx.ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Card ──
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Card Header ──
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
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
    primary:
      'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    yellow:
      'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    red:
      'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  const safeTitle = typeof title === 'object' ? JSON.stringify(title) : title;
  const safeValue = typeof value === 'object' ? JSON.stringify(value) : value;
  const safeTrend = typeof trend === 'object' ? JSON.stringify(trend) : trend;

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {safeTitle}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {safeValue}
          </p>

          {safeTrend && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
              {safeTrend}
            </p>
          )}
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
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',

  CONFIRMED:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',

  COMPLETED:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',

  CANCELLED:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

  NO_SHOW:
    'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-700 dark:text-gray-300',

  UNPAID:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

  PARTIALLY_PAID:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',

  PAID:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',

  OVERDUE:
    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function Badge({
  status,
  children,
}: {
  status: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'badge',
        badgeColors[status] ||
          'bg-gray-100 text-gray-800 dark:text-gray-200 dark:bg-gray-700 dark:text-gray-300',
      )}
    >
      {children ?? status}
    </span>
  );
}

// ── Empty State ──
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg
        className="h-12 w-12 text-gray-300 dark:text-gray-600 dark:text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}

// ── Spinner ──
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400" />
    </div>
  );
}
// At the end of ui.tsx, add:
export { EnhancedEmptyState } from './EmptyStates';