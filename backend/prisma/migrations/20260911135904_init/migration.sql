-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('WHATSAPP', 'PAYMENT', 'VIDEO', 'SMS', 'EMAIL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('BEARER_TOKEN', 'API_KEY_HEADER', 'BASIC_AUTH', 'OAUTH2', 'QUERY_PARAM', 'CUSTOM_HEADERS', 'NONE');

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "providerSubtype" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "baseUrl" TEXT NOT NULL,
    "apiVersion" TEXT,
    "authMethod" "AuthMethod" NOT NULL DEFAULT 'BEARER_TOKEN',
    "credentials" TEXT NOT NULL,
    "requestConfig" JSONB NOT NULL,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "settings" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestSuccess" BOOLEAN,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "successfulRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCapability" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestTemplate" JSONB NOT NULL,
    "responseMapping" JSONB NOT NULL,
    "errorMapping" JSONB NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderUsageLog" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" "ProviderType" NOT NULL,
    "providerSubtype" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authMethod" "AuthMethod" NOT NULL,
    "credentialsTemplate" JSONB NOT NULL,
    "capabilitiesTemplate" JSONB NOT NULL,
    "settingsTemplate" JSONB NOT NULL,
    "icon" TEXT,
    "category" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceProvider_providerType_isActive_priority_idx" ON "ServiceProvider"("providerType", "isActive", "priority");

-- CreateIndex
CREATE INDEX "ServiceProvider_isDefault_idx" ON "ServiceProvider"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_name_providerType_key" ON "ServiceProvider"("name", "providerType");

-- CreateIndex
CREATE INDEX "ProviderCapability_capability_idx" ON "ProviderCapability"("capability");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCapability_providerId_capability_key" ON "ProviderCapability"("providerId", "capability");

-- CreateIndex
CREATE INDEX "ProviderUsageLog_providerId_createdAt_idx" ON "ProviderUsageLog"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderUsageLog_success_createdAt_idx" ON "ProviderUsageLog"("success", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderTemplate_providerType_idx" ON "ProviderTemplate"("providerType");

-- CreateIndex
CREATE INDEX "ProviderTemplate_category_idx" ON "ProviderTemplate"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderTemplate_name_providerType_key" ON "ProviderTemplate"("name", "providerType");

-- AddForeignKey
ALTER TABLE "ProviderCapability" ADD CONSTRAINT "ProviderCapability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderUsageLog" ADD CONSTRAINT "ProviderUsageLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
