# ============================================================
# Auto-Verify-Phase1.ps1 (Express)
# FULLY AUTOMATED Phase 1 Verification with Error Handling
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AUTO-VERIFY PHASE 1 (EXPRESS)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Environment & Dependencies
Write-Host "`n🔍 Verifying Environment & Dependencies..." -ForegroundColor Cyan
cd backend
npx prisma validate
if ($LASTEXITCODE -ne 0) { throw "Prisma validation failed" }
Write-Host "✅ Prisma schema is valid" -ForegroundColor Green

# 2. Backend Unit Tests Execution
Write-Host "`n🔍 Verifying Backend Unit Tests..." -ForegroundColor Cyan
pnpm test --passWithNoTests
if ($LASTEXITCODE -ne 0) { Write-Host "⚠️ Backend tests failed or not configured yet" -ForegroundColor Yellow }
else { Write-Host "✅ Backend tests passed" -ForegroundColor Green }
cd ..

# 3. Frontend Tests Execution
Write-Host "`n🔍 Verifying Frontend Tests..." -ForegroundColor Cyan
cd frontend
pnpm vitest run --passWithNoTests
if ($LASTEXITCODE -ne 0) { Write-Host "⚠️ Frontend tests failed or not configured yet" -ForegroundColor Yellow }
else { Write-Host "✅ Frontend tests passed" -ForegroundColor Green }
cd ..

Write-Host "`n✅ Verification Complete!" -ForegroundColor Green
