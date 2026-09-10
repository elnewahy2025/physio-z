import { type FormEvent } from 'react';
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError(t('invalidCredentials'));
      return;
    }

    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || t('invalidCredentials');
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 end-6 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
      >
        {lang === 'ar' ? 'English' : 'ط§ظ„ط¹ط±ط¨ظٹط©'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
            <Stethoscope size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('appName')}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {lang === 'ar' ? 'ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ط¥ظ„ظ‰ ط­ط³ط§ط¨ظƒ' : 'Sign in to your account'}
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="label">
                {t('phoneOrEmail')}
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={lang === 'ar' ? '01xxxxxxxxx' : '01xxxxxxxxx or email'}
                className="input"
                autoComplete="username"
                required
                dir="ltr"
                style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="input pe-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('loading')}
                </span>
              ) : (
                t('signIn')
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          {lang === 'ar' ? 'ظ…ط±ظƒط² ط§ظ„ط¹ظ„ط§ط¬ ط§ظ„ط·ط¨ظٹط¹ظٹ' : 'Physio Center'} آ© 2026
        </p>
      </div>
    </div>
  );
}