$scripts = @(
  ".\Fix-RBAC-Security.ps1",
  ".\RBAC-Verification-Production-Prep.ps1",
  ".\Phase4-Integrated-Implementation.ps1",
  ".\Dynamic-Provider-System.ps1",
  ".\Phase5-Intelligence.ps1",
  ".\Phase6-N3-ExerciseLibrary.ps1",
  ".\Phase6-Complete.ps1",
  ".\Testing-Documentation-Phase1.ps1",
  ".\Auto-Verify-Phase1.ps1",
  ".\STRICT-AUDIT.ps1",
  ".\COMPLETE-100-Percent-Audit.ps1",
  ".\Phase7-Audit-Backup.ps1"
)

$report = @()
$report += "# Phase Execution Report"
$report += "Date: $(Get-Date)"
$report += ""
$report += "| Script | Status |"
$report += "|--------|--------|"

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "=========================================="
        Write-Host "Executing $script ..."
        Write-Host "=========================================="
        try {
            # Execute the script
            & pwsh.exe -ExecutionPolicy Bypass -NonInteractive -File $script
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0 -or $null -eq $exitCode) {
                Write-Host "SUCCESS: $script" -ForegroundColor Green
                $report += "| $script | ✅ SUCCESS |"
            } else {
                Write-Host "FAILED: $script (Exit Code: $exitCode)" -ForegroundColor Red
                $report += "| $script | ❌ FAIL |"
            }
        } catch {
            Write-Host "ERROR: $script failed to execute" -ForegroundColor Red
            $report += "| $script | ❌ ERROR |"
        }
    } else {
        Write-Host "SKIPPED: $script (File not found)" -ForegroundColor Yellow
        $report += "| $script | ⚠️ SKIPPED |"
    }
}

$report += ""
$report += "Execution complete."
$report | Out-File -FilePath "Execution-Report.md" -Encoding UTF8
Write-Host "Report saved to Execution-Report.md"
