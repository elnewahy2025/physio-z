import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface AddonFeatureDef {
  key: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  path: string;
  icon: string;
  category: 'communication' | 'clinical' | 'intelligence' | 'finance' | 'system';
  isPopular?: boolean;
}

export const ADDON_FEATURES: AddonFeatureDef[] = [
  {
    key: 'whatsapp',
    nameEn: 'WhatsApp Smart Reminders',
    nameAr: 'تذكيرات واتساب الذكية',
    descriptionEn: 'Automated and simulated WhatsApp appointment confirmations and instant patient notifications.',
    descriptionAr: 'تأكيدات المواعيد التلقائية وإشعارات المرضى الفورية عبر محاكاة وبوابة واتساب.',
    path: '/integrations/whatsapp',
    icon: '💬',
    category: 'communication',
    isPopular: true,
  },
  {
    key: 'video',
    nameEn: 'Telehealth & Video Consultations',
    nameAr: 'استشارات الفيديو عن بُعد',
    descriptionEn: 'Integrated remote telehealth sessions with Zoom, Google Meet, and Teams quick meeting launch.',
    descriptionAr: 'جلسات استشارية عن بُعد تدعم الروابط المباشرة لتطبيقات Zoom و Meet و Teams.',
    path: '/integrations/video',
    icon: '📹',
    category: 'communication',
  },
  {
    key: 'payments',
    nameEn: 'Online Payment Gateways',
    nameAr: 'بوابات الدفع الإلكتروني',
    descriptionEn: 'Dynamic integration for Egyptian & Global payment gateways (Fawry, InstaPay, Stripe, PayPal).',
    descriptionAr: 'ربط بوابات الدفع المصرية والعالمية (فوري، إنستاباي، سترايب، باي بال) لتسوية الفواتير.',
    path: '/integrations/payments',
    icon: '💳',
    category: 'finance',
    isPopular: true,
  },
  {
    key: 'protocols',
    nameEn: 'Clinical Decision Support (CDSS)',
    nameAr: 'البروتوكولات ودعم القرار السريري',
    descriptionEn: 'Evidence-based rehabilitation protocols, differential diagnosis engine, and recovery curves.',
    descriptionAr: 'بروتوكولات إعادة التأهيل الدولية المعتمدة، واقتراح التشخيص التفريقي ومنحنيات التعافي.',
    path: '/protocols',
    icon: '🩺',
    category: 'clinical',
    isPopular: true,
  },
  {
    key: 'exercises',
    nameEn: 'Exercise Prescription Library',
    nameAr: 'مكتبة الوصفات والتمارين',
    descriptionEn: 'Categorized physical therapy exercise database with muscle targets and difficulty ratings.',
    descriptionAr: 'قاعدة بيانات التمارين العلاجية المصنفة حسب المفاصل ومستويات الصعوبة والأهداف العضلية.',
    path: '/exercises',
    icon: '🏋️',
    category: 'clinical',
  },
  {
    key: 'intelligence',
    nameEn: 'Predictive AI & No-Show Forecasts',
    nameAr: 'الذكاء الاصطناعي وتوقع التغيب',
    descriptionEn: 'Machine-learning models to predict patient no-show risks and clinic appointment demand.',
    descriptionAr: 'نماذج ذكاء اصطناعي تتنبأ باحتمالية غياب المرضى وتتوقع حجم الإقبال على العيادة.',
    path: '/intelligence',
    icon: '📊',
    category: 'intelligence',
    isPopular: true,
  },
  {
    key: 'audit',
    nameEn: 'Security & Activity Audit Logs',
    nameAr: 'سجلات الأمان والتدقيق الشاملة',
    descriptionEn: 'Compliant tracking of all sensitive medical actions, logins, and billing modifications.',
    descriptionAr: 'تتبع شامل لكافة العمليات الطبية الحساسة، وتسجيلات الدخول، وتعديلات الفواتير مع تصدير CSV.',
    path: '/audit-logs',
    icon: '🛡️',
    category: 'system',
  },
  {
    key: 'backups',
    nameEn: 'Encrypted Database Backups',
    nameAr: 'النسخ الاحتياطي المشفر للبيانات',
    descriptionEn: 'Automated and on-demand encrypted database snapshots and download controls.',
    descriptionAr: 'إنشاء وتنزيل النسخ الاحتياطية المشفرة لقاعدة بيانات المركز لضمان استمرارية العمل.',
    path: '/backups',
    icon: '💾',
    category: 'system',
  },
  {
    key: 'insurance',
    nameEn: 'Insurance & Claims Management',
    nameAr: 'إدارة التأمين والمطالبات',
    descriptionEn: 'End-to-end medical insurance claims, co-pay calculation, pre-authorization, and provider billing.',
    descriptionAr: 'إدارة مطالبات التأمين الطبي وحساب نسبة التحمل (الكو-باي) والموافقات المسبقة ومطالبات الشركات.',
    path: '/insurance',
    icon: '🏥',
    category: 'finance',
    isPopular: true,
  },
];

export const DEFAULT_ENABLED_FEATURES: Record<string, boolean> = {
  whatsapp: true,
  video: true,
  payments: true,
  insurance: true,
  protocols: true,
  exercises: true,
  intelligence: true,
  audit: true,
  backups: true,
};

export function useClinicFeatures() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/settings');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  const enabledFeatures: Record<string, boolean> = settings?.enabledFeatures || DEFAULT_ENABLED_FEATURES;

  const isFeatureEnabled = (key: string): boolean => {
    // If settings haven't loaded yet or field not set, fallback to default
    if (enabledFeatures[key] !== undefined) {
      return Boolean(enabledFeatures[key]);
    }
    return Boolean(DEFAULT_ENABLED_FEATURES[key]);
  };

  const activeCount = ADDON_FEATURES.filter((f) => isFeatureEnabled(f.key)).length;
  const totalCount = ADDON_FEATURES.length;
  const isAllUnlocked = activeCount === totalCount;

  const updateFeaturesMutation = useMutation({
    mutationFn: async (newFeatures: Record<string, boolean>) => {
      const res = await api.put('/settings', {
        enabledFeatures: newFeatures,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const toggleFeature = async (key: string) => {
    const updated = {
      ...enabledFeatures,
      [key]: !isFeatureEnabled(key),
    };
    return updateFeaturesMutation.mutateAsync(updated);
  };

  const unlockAllFeatures = async () => {
    const allUnlocked: Record<string, boolean> = {};
    ADDON_FEATURES.forEach((f) => {
      allUnlocked[f.key] = true;
    });
    return updateFeaturesMutation.mutateAsync(allUnlocked);
  };

  const lockAllFeatures = async () => {
    const allLocked: Record<string, boolean> = {};
    ADDON_FEATURES.forEach((f) => {
      allLocked[f.key] = false;
    });
    return updateFeaturesMutation.mutateAsync(allLocked);
  };

  return {
    isLoading,
    enabledFeatures,
    isFeatureEnabled,
    activeCount,
    totalCount,
    isAllUnlocked,
    toggleFeature,
    unlockAllFeatures,
    lockAllFeatures,
    isUpdating: updateFeaturesMutation.isPending,
  };
}
