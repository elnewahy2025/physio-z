// backend/src/services/intake-form.service.ts
// P1: Patient Intake Forms - Dynamic form management

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import type { Prisma } from '@prisma/client';

/**
 * Get all form templates (dynamic types)
 */
export async function getFormTemplates() {
  // For now, return predefined templates
  // In production, these could be stored in database
  return [
    {
      type: 'initial_assessment',
      title: 'الاستبيان الأولي',
      titleEn: 'Initial Assessment',
      description: 'نموذج التقييم الأولي للمريض الجديد',
      sections: [
        {
          title: 'معلومات شخصية',
          fields: [
            { name: 'fullName', label: 'الاسم الكامل', type: 'text', required: true },
            { name: 'dateOfBirth', label: 'تاريخ الميلاد', type: 'date', required: true },
            { name: 'phone', label: 'رقم الهاتف', type: 'tel', required: true },
            { name: 'email', label: 'البريد الإلكتروني', type: 'email', required: false },
            { name: 'address', label: 'العنوان', type: 'textarea', required: false },
            { name: 'emergencyContact', label: 'جهة الاتصال للطوارئ', type: 'text', required: true },
            { name: 'emergencyPhone', label: 'هاتف الطوارئ', type: 'tel', required: true },
          ]
        },
        {
          title: 'التاريخ الطبي',
          fields: [
            { name: 'chiefComplaint', label: 'الشكوى الرئيسية', type: 'textarea', required: true },
            { name: 'painDuration', label: 'مدة الألم', type: 'select', options: ['أقل من أسبوع', '1-4 أسابيع', '1-3 أشهر', 'أكثر من 3 أشهر'], required: true },
            { name: 'previousInjuries', label: 'إصابات سابقة', type: 'textarea', required: false },
            { name: 'surgeries', label: 'عمليات جراحية', type: 'textarea', required: false },
            { name: 'medications', label: 'الأدوية الحالية', type: 'textarea', required: false },
            { name: 'allergies', label: 'الحساسية', type: 'textarea', required: false },
            { name: 'familyHistory', label: 'التاريخ العائلي', type: 'textarea', required: false },
          ]
        },
        {
          title: 'معلومات التأمين',
          fields: [
            { name: 'insuranceProvider', label: 'شركة التأمين', type: 'text', required: false },
            { name: 'insuranceNumber', label: 'رقم التأمين', type: 'text', required: false },
            { name: 'policyHolder', label: 'صاحب البوليصة', type: 'text', required: false },
          ]
        }
      ]
    },
    {
      type: 'medical_history',
      title: 'التاريخ الطبي المفصل',
      titleEn: 'Detailed Medical History',
      description: 'نموذج التاريخ الطبي الشامل',
      sections: [
        {
          title: 'الحالة الصحية العامة',
          fields: [
            { name: 'chronicConditions', label: 'أمراض مزمنة', type: 'textarea', required: false },
            { name: 'currentMedications', label: 'الأدوية الحالية', type: 'textarea', required: false },
            { name: 'pastTreatments', label: 'علاجات سابقة', type: 'textarea', required: false },
            { name: 'imagingResults', label: 'نتائج الأشعة/التحاليل', type: 'textarea', required: false },
          ]
        }
      ]
    },
    {
      type: 'consent_to_treat',
      title: 'الموافقة على العلاج',
      titleEn: 'Consent to Treatment',
      description: 'نموذج الموافقة على العلاج الطبيعي',
      sections: [
        {
          title: 'الموافقة',
          fields: [
            { name: 'understandTreatment', label: 'أفهم طبيعة العلاج الطبيعي المقترح', type: 'checkbox', required: true },
            { name: 'agreeToTreatment', label: 'أوافق على تلقي العلاج', type: 'checkbox', required: true },
            { name: 'patientSignature', label: 'توقيع المريض', type: 'signature', required: true },
          ]
        }
      ]
    }
  ];
}

/**
 * Start a new intake form for a patient
 */
export async function startIntakeForm(patientId: string, formType: string) {
  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new HttpError(404, 'المريض غير موجود');
  }

  // Check if there's already an incomplete form of this type
  const existingForm = await prisma.intakeForm.findFirst({
    where: {
      patientId,
      formType,
      status: { in: ['pending', 'in_progress'] },
    },
  });

  if (existingForm) {
    return existingForm;
  }

  const data = { patientId, formType };

  // Create new form
  const form = await prisma.intakeForm.create({
    data: {
      patientId: data.patientId,
      formType: data.formType,
      title: data.formType + ' Intake Form',
      status: 'DRAFT',
      startedAt: new Date(),
      formData: {},
    },
  });

  return form;
}

/**
 * Save form progress
 */
export async function saveFormProgress(
  formId: string,
  formData: Record<string, any>
) {
  const form = await prisma.intakeForm.findUnique({
    where: { id: formId },
  });

  if (!form) {
    throw new HttpError(404, 'النموذج غير موجود');
  }

  if (form.status === 'completed') {
    throw new HttpError(400, 'تم إكمال النموذج بالفعل');
  }

  return await prisma.intakeForm.update({
    where: { id: formId },
    data: {
      formData,
      status: 'in_progress',
    },
  });
}

/**
 * Submit completed form
 */
export async function submitIntakeForm(
  formId: string,
  formData: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  const form = await prisma.intakeForm.findUnique({
    where: { id: formId },
    include: { patient: true },
  });

  if (!form) {
    throw new HttpError(404, 'النموذج غير موجود');
  }

  if (form.status === 'completed') {
    throw new HttpError(400, 'تم إرسال النموذج بالفعل');
  }

  // Validate required fields based on form type
  validateFormData(formData, form.formType);

  const updatedForm = await prisma.intakeForm.update({
    where: { id: formId },
    data: {
      formData,
      status: 'completed',
      completedAt: new Date(),
      ipAddress,
      userAgent,
    },
  });

  // Update patient record if this is initial assessment
  if (form.formType === 'initial_assessment') {
    await updatePatientFromIntake(form.patientId, formData);
  }

  return updatedForm;
}

/**
 * Get patient's forms
 */
export async function getPatientForms(
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
      throw new HttpError(403, 'يمكنك فقط الوصول إلى نماذجك الخاصة');
    }
  }

  return await prisma.intakeForm.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get single form by ID
 */
export async function getIntakeFormById(formId: string, userId: string, userRole: string) {
  const form = await prisma.intakeForm.findUnique({
    where: { id: formId },
    include: { patient: true },
  });

  if (!form) {
    throw new HttpError(404, 'النموذج غير موجود');
  }

  // Authorization check
  if (userRole === 'PATIENT' && form.patient.userId !== userId) {
    throw new HttpError(403, 'يمكنك فقط الوصول إلى نماذجك الخاصة');
  }

  return form;
}

/**
 * Validate form data based on form type
 */
function validateFormData(formData: Record<string, any>, formType: string) {
  const requiredFields: Record<string, string[]> = {
    initial_assessment: ['fullName', 'phone', 'emergencyContact', 'chiefComplaint'],
    medical_history: [],
    consent_to_treat: ['understandTreatment', 'agreeToTreatment'],
  };

  const required = requiredFields[formType] || [];
  
  for (const field of required) {
    if (!formData[field]) {
      throw new HttpError(400, `حقل مطلوب مفقود: ${field}`);
    }
  }
}

/**
 * Update patient record from intake form data
 */
async function updatePatientFromIntake(patientId: string, formData: Record<string, any>) {
  const updateData: any = {};
  
  if (formData.fullName) updateData.name = formData.fullName;
  if (formData.phone) updateData.phone = formData.phone;
  if (formData.email) updateData.email = formData.email;
  if (formData.address) updateData.address = formData.address;
  if (formData.dateOfBirth) updateData.dateOfBirth = new Date(formData.dateOfBirth);
  
  if (formData.chiefComplaint || formData.previousInjuries) {
    const medicalHistory = [
      formData.chiefComplaint ? `الشكوى الرئيسية: ${formData.chiefComplaint}` : '',
      formData.previousInjuries ? `إصابات سابقة: ${formData.previousInjuries}` : '',
    ].filter(Boolean).join('\n');
    
    updateData.medicalHistory = medicalHistory;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });
  }
}
