// frontend/src/components/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Calendar,
  DollarSign,
  UserPlus,
  XCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { useI18n } from '../i18n';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  APPOINTMENT_BOOKED: <Calendar size={16} className="text-blue-600" />,
  APPOINTMENT_CONFIRMED: <CheckCircle size={16} className="text-green-600" />,
  APPOINTMENT_CANCELLED: <XCircle size={16} className="text-red-600" />,
  APPOINTMENT_COMPLETED: <CheckCircle size={16} className="text-teal-600" />,
  PAYMENT_RECEIVED: <DollarSign size={16} className="text-emerald-600" />,
  INVOICE_CREATED: <FileText size={16} className="text-purple-600" />,
  PATIENT_REGISTERED: <UserPlus size={16} className="text-teal-600" />,
};

export default function NotificationBell() {
  const { lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead.mutate(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return L('الآن', 'Just now');
    if (minutes < 60) return L(`قبل ${minutes} دقيقة`, `${minutes}m ago`);
    if (hours < 24) return L(`قبل ${hours} ساعة`, `${hours}h ago`);
    return L(`قبل ${days} يوم`, `${days}d ago`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              {L('الإشعارات', 'Notifications')}
              {unreadCount > 0 && (
                <span className="ms-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  {unreadCount} {L('جديد', 'new')}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                <CheckCheck size={14} />
                {L('تحديد الكل كمقروء', 'Mark all read')}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell size={24} className="text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  {L('لا توجد إشعارات', 'No notifications')}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    flex w-full items-start gap-3 border-b border-gray-50 p-4 text-start transition-colors hover:bg-gray-50
                    ${!notification.isRead ? 'bg-primary-50/50' : ''}
                  `}
                >
                  <div
                    className={`
                    flex h-9 w-9 shrink-0 items-center justify-center rounded-lg
                    ${!notification.isRead ? 'bg-primary-100' : 'bg-gray-100'}
                  `}
                  >
                    {NOTIFICATION_ICONS[notification.type] || (
                      <Bell size={16} className="text-gray-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 p-3 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {L('عرض جميع الإشعارات', 'View all notifications')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}