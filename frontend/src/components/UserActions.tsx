// frontend/src/components/UserActions.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Shield, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import PasswordStrength from './PasswordStrength';
import { useAuthStore } from '../store/auth';

interface UserActionsProps {
  userId: string;
  userName: string;
  currentRole: string;
}

export function ResetPasswordButton({ userId, userName }: UserActionsProps) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPassword = useMutation({
    mutationFn: async () => {
      // First verify owner's password
      await api.post('/auth/login', {
        identifier: currentUser?.phone,
        password: ownerPassword,
      });

      // Then reset the target user's password
      await api.put(`/users/${userId}`, {
        password: newPassword,
      });
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setNewPassword('');
        setOwnerPassword('');
      }, 2000);
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
        L('فشل إعادة التعيين', 'Reset failed'),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(L('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters'));
      return;
    }
    if (!ownerPassword) {
      setError(L('أدخل كلمة المرور الخاصة بك', 'Enter your own password'));
      return;
    }

    resetPassword.mutate();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        title={L('إعادة تعيين كلمة المرور', 'Reset Password')}
      >
        <KeyRound size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                <KeyRound size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {L('إعادة تعيين كلمة المرور', 'Reset Password')}
                </h2>
                <p className="text-sm text-gray-500">{userName}</p>
              </div>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-8">
                <Check size={40} className="text-green-600" />
                <p className="mt-4 font-semibold text-green-600">
                  {L('تم بنجاح!', 'Success!')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="label">
                    {L('كلمة المرور الجديدة', 'New Password')} *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                  <PasswordStrength password={newPassword} />
                </div>

                <div>
                  <label className="label">
                    {L('كلمة المرور الخاصة بك (تأكيد)', 'Your Password (confirm)')} *
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="input"
                    required
                    placeholder={L('كلمة مرورك الحالية', 'Your current password')}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {L('للتحقق من هويتك', 'To verify your identity')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resetPassword.isPending}
                  className="btn-primary w-full"
                >
                  {resetPassword.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    L('إعادة التعيين', 'Reset Password')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function ChangeRoleButton({ userId, userName, currentRole }: UserActionsProps) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const roleLabels: Record<string, { ar: string; en: string; color: string }> = {
    THERAPIST: { ar: 'أخصائي علاج طبيعي', en: 'Therapist', color: 'bg-blue-50 text-blue-700 border-blue-300' },
    SECRETARY: { ar: 'سكرتارية', en: 'Secretary', color: 'bg-teal-50 text-teal-700 border-teal-300' },
  };

  const changeRole = useMutation({
    mutationFn: async () => {
      await api.put(`/users/${userId}`, { role: selectedRole });
    },
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || L('فشل التغيير', 'Failed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    changeRole.mutate();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        title={L('تغيير الدور', 'Change Role')}
      >
        <Shield size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {L('تغيير الدور', 'Change Role')}
              </h2>
              <p className="text-sm text-gray-500">{userName}</p>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-8">
                <Check size={40} className="text-green-600" />
                <p className="mt-4 font-semibold text-green-600">
                  {L('تم بنجاح!', 'Success!')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {Object.entries(roleLabels).map(([role, info]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`
                        w-full rounded-xl border-2 p-4 text-start transition-all
                        ${selectedRole === role
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {lang === 'ar' ? info.ar : info.en}
                          </p>
                          {currentRole === role && (
                            <span className="text-xs text-gray-400">
                              {L('(الحالي)', '(current)')}
                            </span>
                          )}
                        </div>
                        {selectedRole === role && (
                          <Check size={20} className="text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={changeRole.isPending || selectedRole === currentRole}
                  className="btn-primary w-full"
                >
                  {changeRole.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    L('تأكيد التغيير', 'Confirm Change')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}