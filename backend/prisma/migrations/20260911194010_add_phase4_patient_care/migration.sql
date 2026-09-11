-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('STRETCHING', 'STRENGTHENING', 'MOBILITY', 'BALANCE', 'CARDIO', 'FUNCTIONAL', 'MANUAL_THERAPY', 'POST_SURGICAL', 'SPORTS_SPECIFIC', 'GERIATRIC', 'PEDIATRIC');

-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ExercisePosition" AS ENUM ('SUPINE', 'PRONE', 'SIDE_LYING', 'SITTING', 'STANDING', 'KNEELING', 'QUADRUPED', 'ALL_FOUR');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'EXPORT', 'BACKUP', 'RESTORE', 'SETTINGS_CHANGE', 'PERMISSION_CHANGE');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('GENERAL', 'PATIENT_DATA', 'MEDICAL_RECORDS', 'FINANCIAL', 'APPOINTMENTS', 'USER_MANAGEMENT', 'SYSTEM', 'SECURITY');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('FULL', 'PARTIAL', 'DATABASE_ONLY', 'FILES_ONLY');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "instapayHandle" TEXT,
ADD COLUMN     "myFawryMerchantCode" TEXT,
ADD COLUMN     "paymentExpiryHours" INTEGER NOT NULL DEFAULT 24;

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "difficulty" "ExerciseDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "instructionsAr" TEXT NOT NULL,
    "startingPosition" TEXT,
    "endingPosition" TEXT,
    "position" "ExercisePosition",
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "animationUrl" TEXT,
    "defaultSets" INTEGER NOT NULL DEFAULT 3,
    "defaultReps" INTEGER NOT NULL DEFAULT 10,
    "defaultHoldTime" INTEGER,
    "defaultRestTime" INTEGER NOT NULL DEFAULT 60,
    "estimatedTime" INTEGER,
    "contraindications" TEXT,
    "precautions" TEXT,
    "commonErrors" TEXT,
    "progressions" TEXT,
    "regressions" TEXT,
    "tags" TEXT[],
    "bodyParts" TEXT[],
    "equipment" TEXT[],
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExercisePrescription" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "frequency" TEXT,
    "duration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ExercisePrescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAssignment" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "holdTime" INTEGER,
    "restTime" INTEGER,
    "frequency" TEXT,
    "notes" TEXT,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "painLevel" INTEGER,
    "difficulty" TEXT,
    "patientNotes" TEXT,
    "dayOfWeek" INTEGER[],
    "timeOfDay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "setsCompleted" INTEGER NOT NULL DEFAULT 0,
    "repsCompleted" INTEGER NOT NULL DEFAULT 0,
    "painLevel" INTEGER,
    "difficulty" TEXT,
    "notes" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppReminderLog" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageContent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT_MANUALLY',

    CONSTRAINT "WhatsAppReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReference" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "bankDetails" JSONB,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PaymentReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoConsultation" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "platform" TEXT,
    "password" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VideoConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "category" "AuditCategory" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "BackupType" NOT NULL DEFAULT 'FULL',
    "status" "BackupStatus" NOT NULL DEFAULT 'COMPLETED',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "triggeredBy" TEXT,
    "error" TEXT,
    "checksum" TEXT,
    "includes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeForm" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "formData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentForm" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "signatureData" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "witnessName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "pdfUrl" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalFile" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PainMap" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "bodyView" TEXT NOT NULL,
    "xCoordinate" DOUBLE PRECISION NOT NULL,
    "yCoordinate" DOUBLE PRECISION NOT NULL,
    "bodyRegion" TEXT,
    "painIntensity" INTEGER NOT NULL,
    "painType" TEXT NOT NULL,
    "painDescription" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PainMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "photoDate" TIMESTAMP(3) NOT NULL,
    "photoType" TEXT NOT NULL,
    "bodyPart" TEXT,
    "imageData" TEXT NOT NULL,
    "thumbnailData" TEXT,
    "notes" TEXT,
    "takenById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercise_category_difficulty_idx" ON "Exercise"("category", "difficulty");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_nameAr_idx" ON "Exercise"("nameAr");

-- CreateIndex
CREATE INDEX "Exercise_isActive_idx" ON "Exercise"("isActive");

-- CreateIndex
CREATE INDEX "Exercise_bodyParts_idx" ON "Exercise"("bodyParts");

-- CreateIndex
CREATE INDEX "Exercise_tags_idx" ON "Exercise"("tags");

-- CreateIndex
CREATE INDEX "ExercisePrescription_patientId_status_idx" ON "ExercisePrescription"("patientId", "status");

-- CreateIndex
CREATE INDEX "ExercisePrescription_therapistId_createdAt_idx" ON "ExercisePrescription"("therapistId", "createdAt");

-- CreateIndex
CREATE INDEX "ExercisePrescription_startDate_endDate_idx" ON "ExercisePrescription"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ExerciseAssignment_prescriptionId_idx" ON "ExerciseAssignment"("prescriptionId");

-- CreateIndex
CREATE INDEX "ExerciseAssignment_exerciseId_idx" ON "ExerciseAssignment"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAssignment_prescriptionId_exerciseId_key" ON "ExerciseAssignment"("prescriptionId", "exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseLog_assignmentId_completedAt_idx" ON "ExerciseLog"("assignmentId", "completedAt");

-- CreateIndex
CREATE INDEX "ExerciseLog_completedAt_idx" ON "ExerciseLog"("completedAt");

-- CreateIndex
CREATE INDEX "WhatsAppReminderLog_appointmentId_sentAt_idx" ON "WhatsAppReminderLog"("appointmentId", "sentAt");

-- CreateIndex
CREATE INDEX "WhatsAppReminderLog_sentById_sentAt_idx" ON "WhatsAppReminderLog"("sentById", "sentAt");

-- CreateIndex
CREATE INDEX "PaymentReference_invoiceId_idx" ON "PaymentReference"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentReference_status_idx" ON "PaymentReference"("status");

-- CreateIndex
CREATE INDEX "PaymentReference_paymentMethod_idx" ON "PaymentReference"("paymentMethod");

-- CreateIndex
CREATE INDEX "VideoConsultation_appointmentId_idx" ON "VideoConsultation"("appointmentId");

-- CreateIndex
CREATE INDEX "VideoConsultation_platform_idx" ON "VideoConsultation"("platform");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_category_severity_idx" ON "AuditLog"("category", "severity");

-- CreateIndex
CREATE INDEX "BackupRecord_status_createdAt_idx" ON "BackupRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_type_createdAt_idx" ON "BackupRecord"("type", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_action_createdAt_idx" ON "UserActivity"("action", "createdAt");

-- CreateIndex
CREATE INDEX "IntakeForm_patientId_status_idx" ON "IntakeForm"("patientId", "status");

-- CreateIndex
CREATE INDEX "IntakeForm_formType_idx" ON "IntakeForm"("formType");

-- CreateIndex
CREATE INDEX "ConsentForm_patientId_signedAt_idx" ON "ConsentForm"("patientId", "signedAt");

-- CreateIndex
CREATE INDEX "ConsentForm_consentType_idx" ON "ConsentForm"("consentType");

-- CreateIndex
CREATE INDEX "MedicalFile_patientId_category_idx" ON "MedicalFile"("patientId", "category");

-- CreateIndex
CREATE INDEX "MedicalFile_category_createdAt_idx" ON "MedicalFile"("category", "createdAt");

-- CreateIndex
CREATE INDEX "PainMap_patientId_createdAt_idx" ON "PainMap"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "PainMap_appointmentId_idx" ON "PainMap"("appointmentId");

-- CreateIndex
CREATE INDEX "ProgressPhoto_patientId_photoDate_idx" ON "ProgressPhoto"("patientId", "photoDate");

-- CreateIndex
CREATE INDEX "ProgressPhoto_photoType_idx" ON "ProgressPhoto"("photoType");

-- AddForeignKey
ALTER TABLE "ExercisePrescription" ADD CONSTRAINT "ExercisePrescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercisePrescription" ADD CONSTRAINT "ExercisePrescription_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercisePrescription" ADD CONSTRAINT "ExercisePrescription_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAssignment" ADD CONSTRAINT "ExerciseAssignment_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "ExercisePrescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAssignment" ADD CONSTRAINT "ExerciseAssignment_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseLog" ADD CONSTRAINT "ExerciseLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ExerciseAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppReminderLog" ADD CONSTRAINT "WhatsAppReminderLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppReminderLog" ADD CONSTRAINT "WhatsAppReminderLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReference" ADD CONSTRAINT "PaymentReference_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReference" ADD CONSTRAINT "PaymentReference_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoConsultation" ADD CONSTRAINT "VideoConsultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoConsultation" ADD CONSTRAINT "VideoConsultation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeForm" ADD CONSTRAINT "IntakeForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentForm" ADD CONSTRAINT "ConsentForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFile" ADD CONSTRAINT "MedicalFile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFile" ADD CONSTRAINT "MedicalFile_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalFile" ADD CONSTRAINT "MedicalFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PainMap" ADD CONSTRAINT "PainMap_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PainMap" ADD CONSTRAINT "PainMap_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
