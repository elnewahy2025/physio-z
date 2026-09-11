// frontend/src/components/ChangePasswordModal.tsx
import { useState, type FormEvent } from 'react';
import { X, Lock, Eye, EyeOff, Check, AlertCircle, KeyRound } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';
import PasswordStrength from './PasswordStrength';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { user } = useAuthStore();

  const handleClose = () => {
    // Reset state
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError(null);
    setSuccess(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.currentPassword) {
      setError(L('أدخل كلمة المرور الحالية', 'Enter your current password'));
      return;
    }
    if (formData.newPassword.length < 8) {
      setError(L('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'New password must be at least 8 characters'));
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError(L('كلمات المرور الجديدة غير متطابقة', 'New passwords do not match'));
      return;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError(L('كلمة المرور الجديدة يجب أن تكون مختلفة', 'New password must be different from current'));
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.patch('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      // Update tokens in localStorage
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);

      // Update user data
      localStorage.setItem('user', JSON.stringify(res.data.user));

      setSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => handleClose(), 2000);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        L('فشل تغيير كلمة المرور', 'Failed to change password');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {L('تغيير كلمة المرور', 'Change Password')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.name}
            </p>
          </div>
        </div>

        {/* Success state */}
        {success && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {L('تم تغيير كلمة المرور بنجاح!', 'Password changed successfully!')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {L('جاري الإغلاق...', 'Closing...')}
            </p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current password */}
            <div>
              <label className="label">
                {L('كلمة المرور الحالية', 'Current Password')} *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, currentPassword: e.target.value })
                  }
                  className="input !ps-9 !pe-10"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="label">
                {L('كلمة المرور الجديدة', 'New Password')} *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  className="input !ps-9 !pe-10"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength indicator */}
              <PasswordStrength password={formData.newPassword} />
            </div>

            {/* Confirm new password */}
            <div>
              <label className="label">
                {L('تأكيد كلمة المرور الجديدة', 'Confirm New Password')} *
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className={`input !ps-9 !pe-10 ${
                    formData.confirmPassword &&
                    formData.confirmPassword !== formData.newPassword
                      ? '!border-red-300 focus:!border-red-500 focus:!ring-red-500'
                      : formData.confirmPassword &&
                          formData.confirmPassword === formData.newPassword
                        ? '!border-green-300 focus:!border-green-500 focus:!ring-green-500'
                        : ''
                  }`}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Match indicator */}
              {formData.confirmPassword && (
                <div className="mt-1">
                  {formData.confirmPassword === formData.newPassword ? (
                    <p className="flex items-center gap-1 text-xs text-green-600">
                      <Check size={12} />
                      {L('كلمات المرور متطابقة', 'Passwords match')}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      {L('كلمات المرور غير متطابقة', 'Passwords do not match')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.currentPassword ||
                !formData.newPassword ||
                !formData.confirmPassword
              }
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {L('جاري التغيير...', 'Changing...')}
                </span>
              ) : (
                L('تغيير كلمة المرور', 'Change Password')
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}