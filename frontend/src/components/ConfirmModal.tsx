// frontend/src/components/ConfirmModal.tsx
import { X, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n';
import { cn } from './ui';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger'
}: ConfirmModalProps) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          btnClass: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
          btnClass: 'bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-600 dark:hover:bg-orange-700 focus:ring-orange-500'
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
          btnClass: 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-600 dark:hover:bg-primary-700 focus:ring-primary-500'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800 text-center">
        {/* Icon */}
        <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4", styles.iconBg)}>
          <AlertTriangle size={24} />
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelText || L('إلغاء', 'Cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn("flex-1 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2", styles.btnClass)}
          >
            {confirmText || L('تأكيد', 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
