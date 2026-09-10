import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'ar' | 'en';

const translations = {
  ar: {
    appName: 'مركز العلاج الطبيعي',
    welcome: 'مرحباً',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    phoneOrEmail: 'رقم الهاتف أو البريد الإلكتروني',
    forgotPassword: 'نسيت كلمة المرور؟',
    signIn: 'تسجيل الدخول',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
    dashboard: 'لوحة التحكم',
    patients: 'المرضى',
    appointments: 'المواعيد',
    invoices: 'الفواتير',
    payments: 'المدفوعات',
    sessions: 'الجلسات',
    users: 'المستخدمون',
    settings: 'الإعدادات',
    rooms: 'الغرف',
    reports: 'التقارير',
    todaysAppointments: 'مواعيد اليوم',
    totalPatients: 'إجمالي المرضى',
    totalRevenue: 'إجمالي الإيرادات',
    pendingInvoices: 'فواتير معلقة',
    upcomingAppointments: 'المواعيد القادمة',
    recentPayments: 'المدفوعات الأخيرة',
    mySchedule: 'جدولي',
    nextAppointment: 'موعدك القادم',
    treatmentHistory: 'سجل العلاج',
    confirmed: 'مؤكد',
    pending: 'معلق',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    noShow: 'لم يحضر',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    partiallyPaid: 'مدفوع جزئياً',
    overdue: 'متأخر',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    print: 'طباعة',
    viewAll: 'عرض الكل',
    noData: 'لا توجد بيانات',
    arabic: 'العربية',
    english: 'English',
  },
  en: {
    appName: 'Physio Center',
    welcome: 'Welcome',
    logout: 'Logout',
    login: 'Login',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    phoneOrEmail: 'Phone or Email',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign In',
    loading: 'Loading...',
    error: 'Error',
    invalidCredentials: 'Invalid credentials',
    dashboard: 'Dashboard',
    patients: 'Patients',
    appointments: 'Appointments',
    invoices: 'Invoices',
    payments: 'Payments',
    sessions: 'Sessions',
    users: 'Users',
    settings: 'Settings',
    rooms: 'Rooms',
    reports: 'Reports',
    todaysAppointments: "Today's Appointments",
    totalPatients: 'Total Patients',
    totalRevenue: 'Total Revenue',
    pendingInvoices: 'Pending Invoices',
    upcomingAppointments: 'Upcoming Appointments',
    recentPayments: 'Recent Payments',
    mySchedule: 'My Schedule',
    nextAppointment: 'Your Next Appointment',
    treatmentHistory: 'Treatment History',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    noShow: 'No Show',
    paid: 'Paid',
    unpaid: 'Unpaid',
    partiallyPaid: 'Partially Paid',
    overdue: 'Overdue',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    viewAll: 'View All',
    noData: 'No data',
    arabic: 'العربية',
    english: 'English',
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;

interface I18nContextType {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('language', newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey) => {
    return translations[lang][key] ?? key;
  };

  return (
    <I18nContext.Provider
      value={{ lang, t, setLang, isRTL: lang === 'ar' }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}