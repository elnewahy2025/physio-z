import { type FormEvent, useEffect, useState } from 'react';
import {
  Stethoscope,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';
import api from '../lib/api';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number>(0);

  const { login, isLoading } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

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
  });

  // ─── Rate limit countdown ───
  useEffect(() => {
    if (rateLimitSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (rateLimitSeconds > 0) {
      return;
    }

    setError(null);

    if (!identifier.trim() || !password) {
      setError(t('invalidCredentials'));
      return;
    }

    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err: any) {
      let message = t('invalidCredentials');

      if (err.code === 'RATE_LIMITED') {
        message = err.message || 'Too many requests';

        if (err.retryAfter) {
          const retryAfterSeconds = Number(err.retryAfter);

          if (
            Number.isFinite(retryAfterSeconds) &&
            retryAfterSeconds > 0
          ) {
            setRateLimitSeconds(
              Math.ceil(retryAfterSeconds),
            );
          }
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setError(message);
    }
  };

  const isRateLimited = rateLimitSeconds > 0;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Language toggle */}
      <button
        type="button"
        onClick={() =>
          setLang(lang === 'ar' ? 'en' : 'ar')
        }
        className="absolute top-6 end-6 rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          {settings?.centerLogo ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg bg-white dark:bg-gray-900">
              <img
                src={settings.centerLogo}
                alt={settings.centerName || t('appName')}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
              <Stethoscope size={32} />
            </div>
          )}

          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {settings?.centerName || t('appName')}
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {lang === 'ar'
              ? 'سجل الدخول إلى حسابك'
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="card"
        >
          {error && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
                isRateLimited
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {isRateLimited ? (
                <Clock
                  size={16}
                  className="shrink-0"
                />
              ) : (
                <AlertCircle
                  size={16}
                  className="shrink-0"
                />
              )}

              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="identifier"
                className="label"
              >
                {t('phoneOrEmail')}
              </label>

              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                placeholder={
                  lang === 'ar'
                    ? '01xxxxxxxxx'
                    : '01xxxxxxxxx or email'
                }
                className="input"
                autoComplete="username"
                required
                dir="ltr"
                style={{
                  textAlign:
                    lang === 'ar' ? 'right' : 'left',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="label"
              >
                {t('password')}
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="input pe-10"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? lang === 'ar'
                        ? 'إخفاء كلمة المرور'
                        : 'Hide password'
                      : lang === 'ar'
                        ? 'إظهار كلمة المرور'
                        : 'Show password'
                  }
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isLoading || rateLimitSeconds > 0
              }
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rateLimitSeconds > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock size={16} />

                  {lang === 'ar'
                    ? `انتظر ${Math.ceil(
                        rateLimitSeconds / 60,
                      )} دقيقة`
                    : `Wait ${Math.ceil(
                        rateLimitSeconds / 60,
                      )} min`}
                </span>
              ) : isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('loading')}
                </span>
              ) : (
                t('signIn')
              )}
            </button>
          </div>
        </form>

        {/* Registration link */}
        <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'ar'
              ? 'ليس لديك حساب؟'
              : "Don't have an account?"}{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {lang === 'ar'
                ? 'إنشاء حساب'
                : 'Create account'}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
          {lang === 'ar'
            ? 'مركز العلاج الطبيعي'
            : 'Physio Center'}{' '}
          © 2026
        </p>
      </div>
    </div>
  );
}