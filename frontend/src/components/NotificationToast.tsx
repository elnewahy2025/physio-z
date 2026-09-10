// frontend/src/components/NotificationToast.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, DollarSign, Calendar, UserPlus, FileText } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useI18n } from '../i18n';

const TOAST_ICONS: Record<string, React.ReactNode> = {
  APPOINTMENT_BOOKED: <Calendar size={18} className="text-blue-600" />,
  APPOINTMENT_CONFIRMED: <CheckCircle size={18} className="text-green-600" />,
  APPOINTMENT_CANCELLED: <X size={18} className="text-red-600" />,
  PAYMENT_RECEIVED: <DollarSign size={18} className="text-emerald-600" />,
  INVOICE_CREATED: <FileText size={18} className="text-purple-600" />,
  PATIENT_REGISTERED: <UserPlus size={18} className="text-teal-600" />,
};

export default function NotificationToast() {
  const { latestNotification } = useNotifications();
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const navigate = useNavigate();

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  useEffect(() => {
    if (latestNotification) {
      setCurrentNotification(latestNotification);
      setVisible(true);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  if (!visible || !currentNotification) return null;

  const handleClick = () => {
    if (currentNotification.link) {
      navigate(currentNotification.link);
    }
    setVisible(false);
  };

  return (
    <div
      className={`
      fixed top-16 end-4 z-[70] max-w-sm cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-2xl
      transition-all duration-300
      ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
    `}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          {TOAST_ICONS[currentNotification.type] || (
            <CheckCircle size={18} className="text-gray-500" />
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {currentNotification.title}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {currentNotification.message}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}