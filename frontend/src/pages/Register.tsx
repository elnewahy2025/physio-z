// frontend/src/pages/Register.tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff, AlertCircle, Phone, Mail, Calendar, FileText, User } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = account, 2 = medical info

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    medicalHistory: '',
  });

  const { login } = useAuthStore();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(L('كلمات المرور غير متطابقة', 'Passwords do not match'));
      return;
    }

    setIsLoading(true);

    try {
      // Register the account
      const response = await api.post('/auth/register', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth || undefined,
        medicalHistory: formData.medicalHistory || undefined,
      });

      // Auto-login after registration
      await login(formData.phone, formData.password);
      navigate('/');
    } catch (err: any) {
      const message =
        err.response?.data?.message || L('فشل التسجيل', 'Registration failed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.password) {
        setError(L('يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields'));
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(L('كلمات المرور غير متطابقة', 'Passwords do not match'));
        return;
      }
      setError(null);
      setStep(2);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        className="absolute top-6 end-6 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
      >
        {lang === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
            <Stethoscope size={32} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('إنشاء حساب مريض', 'Create Patient Account')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {L('سجل للحصول على مواعيدك وسجلك الطبي', 'Register to book appointments and access your records')}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            1
          </div>
          <div className={`h-1 w-16 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            2
          </div>
        </div>

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">
                  {L('الاسم الكامل', 'Full Name')} *
                </label>
                <div className="relative">
                  <User size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input !ps-9"
                    required
                    minLength={2}
                    placeholder={L('أحمد محمد', 'Ahmed Mohamed')}
                  />
                </div>
              </div>

              <div>
                <label className="label">{L('رقم الهاتف', 'Phone Number')} *</label>
                <div className="relative">
                  <Phone size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input !ps-9"
                    required
                    minLength={8}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="label">{L('البريد الإلكتروني (اختياري)', 'Email (optional)')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input !ps-9"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="label">{L('كلمة المرور', 'Password')} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input !pe-10"
                    required
                    minLength={6}
                    placeholder="••••••••"
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

              <div>
                <label className="label">{L('تأكيد كلمة المرور', 'Confirm Password')} *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input"
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="btn-primary w-full"
              >
                {L('التالي', 'Next')}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                {L(
                  'هذه المعلومات اختيارية لكنها تساعد أخصائي العلاج الطبيعي على تقديم رعاية أفضل',
                  'This information is optional but helps your physiotherapist provide better care',
                )}
              </div>

              <div>
                <label className="label">{L('تاريخ الميلاد', 'Date of Birth')}</label>
                <div className="relative">
                  <Calendar size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input !ps-9"
                  />
                </div>
              </div>

              <div>
                <label className="label">{L('التاريخ الطبي', 'Medical History')}</label>
                <div className="relative">
                  <FileText size={16} className="absolute start-3 top-3 text-gray-400" />
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    className="input !ps-9"
                    rows={4}
                    placeholder={L(
                      'أي حالة طبية، أدوية تتناولها، حساسية، عمليات سابقة...',
                      'Any conditions, medications, allergies, previous surgeries...',
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  {L('السابق', 'Back')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {L('جاري التسجيل...', 'Registering...')}
                    </span>
                  ) : (
                    L('إنشاء الحساب', 'Create Account')
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-sm text-gray-500">
              {L('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                {L('تسجيل الدخول', 'Sign In')}
              </Link>
            </p>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          {L('مركز العلاج الطبيعي', 'Physio Center')} © 2026
        </p>
      </div>
    </div>
  );
}