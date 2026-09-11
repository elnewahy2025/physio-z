// backend/src/services/consent-form.service.ts
// P2: Consent Forms + Digital Signature

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

/**
 * Get consent templates
 */
export async function getConsentTemplates() {
  return [
    {
      type: 'treatment',
      title: 'الموافقة على العلاج الطبيعي',
      titleEn: 'Physiotherapy Treatment Consent',
      requiresWitness: false,
      content: `
أنا، الموقّع أدناه، أقر بأنني:
1. قد شرح لي طبيعة العلاج الطبيعي المقترح وفوائده المتوقعة
2. أفهم المخاطر المحتملة والمضاعفات الممكنة
3. تم إعلامي بالبدائل العلاجية المتاحة
4. أعلم بحقي في رفض العلاج أو إيقافه في أي وقت
5. تم الرد على جميع استفساراتي بشكل مرضٍ

أوافق على تلقي العلاج الطبيعي كما هو مقترح من الفريق الطبي.
      `
    },
    {
      type: 'privacy',
      title: 'الموافقة على الخصوصية',
      titleEn: 'Privacy Consent',
      requiresWitness: false,
      content: `
أوافق على:
1. جمع وتخزين بياناتي الطبية لأغراض العلاج
2. مشاركة معلوماتي الطبية مع الفريق المعالج
3. استخدام صوري لأغراض التوثيق الطبي (إن لزم)
      `
    },
    {
      type: 'financial',
      title: 'الموافقة المالية',
      titleEn: 'Financial Consent',
      requiresWitness: false,
      content: `
أفهم وأوافق على:
1. تكلفة الجلسة العلاجية المذكورة
2. سياسة الإلغاء والمواعيد الفائتة
3. طرق الدفع المتاحة
4. سياسة استرداد المبالغ
      `
    },
    {
      type: 'photo',
      title: 'الموافقة على التصوير',
      titleEn: 'Photography Consent',
      requiresWitness: false,
      content: `
أوافق على:
1. أخذ صور توثيقية لحالتي قبل وأثناء وبعد العلاج
2. استخدام هذه الصور لأغراض التوثيق الطبي
3. عدم نشر هذه الصور دون موافقتي الكاملة
      `
    }
  ];
}

/**
 * Sign a consent form
 */
export async function signConsent(
  patientId: string,
  consentType: string,
  signatureData: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  witnessName?: string
) {
  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new HttpError(404, 'المريض غير موجود');
  }

  // Get template
  const templates = await getConsentTemplates();
  const template = templates.find(t => t.type === consentType);
  
  if (!template) {
    throw new HttpError(400, 'نوع الموافقة غير صحيح');
  }

  // Check if witness is required
  if (template.requiresWitness && !witnessName) {
    throw new HttpError(400, 'توقيع الشاهد مطلوب لهذه الموافقة');
  }

  // Validate signature data
  if (!signatureData || !signatureData.startsWith('data:image')) {
    throw new HttpError(400, 'بيانات التوقيع غير صحيحة');
  }

  // Save consent
  const consent = await prisma.consentForm.create({
    data: {
      patientId,
      consentType,
      consentText: template.content,
      title: template.title,
      signatureData,
      signedAt: new Date(),
      witnessName,
      ipAddress,
      userAgent,
      version: '1.0',
    },
  });

  return consent;
}

/**
 * Get patient's consents
 */
export async function getPatientConsents(
  patientId: string,
  userId: string,
  userRole: string
) {
  // Authorization check
  if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      throw new HttpError(403, 'يمكنك فقط الوصول إلى موافقاتك الخاصة');
    }
  }

  return await prisma.consentForm.findMany({
    where: { patientId },
    orderBy: { signedAt: 'desc' },
  });
}

/**
 * Verify a consent form
 */
export async function verifyConsent(consentId: string) {
  const consent = await prisma.consentForm.findUnique({
    where: { id: consentId },
  });

  if (!consent) {
    throw new HttpError(404, 'الموافقة غير موجودة');
  }

  return {
    isValid: true,
    signedAt: consent.signedAt,
    consentType: consent.consentType,
    version: consent.version,
    hasWitness: !!consent.witnessName,
    patientId: consent.patientId,
  };
}

/**
 * Check if patient has specific consent
 */
export async function hasConsent(patientId: string, consentType: string) {
  const consent = await prisma.consentForm.findFirst({
    where: {
      patientId,
      consentType,
    },
    orderBy: { signedAt: 'desc' },
  });

  return !!consent;
}
