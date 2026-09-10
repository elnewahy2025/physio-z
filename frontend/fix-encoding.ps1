# Fix encoding: reverses the double-encoding that PowerShell caused
 $files = @(
    "frontend\src\pages\Appointments.tsx",
    "frontend\src\pages\Patients.tsx",
    "frontend\src\pages\Invoices.tsx",
    "frontend\src\pages\Settings.tsx"
)

 $win1252 = [System.Text.Encoding]::GetEncoding(1252)
 $utf8 = [System.Text.UTF8Encoding]::new($false)

foreach ($file in $files) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        # Read the corrupted content
        $corrupted = [System.IO.File]::ReadAllText($fullPath, $utf8)
        
        # Reverse the double encoding:
        # 1. Convert mojibake characters back to their Windows-1252 byte values
        # 2. Interpret those bytes as UTF-8 (the correct original encoding)
        $bytes = $win1252.GetBytes($corrupted)
        $fixed = $utf8.GetString($bytes)
        
        # Write the corrected content
        [System.IO.File]::WriteAllText($fullPath, $fixed, $utf8)
        Write-Host "Fixed: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done! Restart the dev server:" -ForegroundColor Cyan
Write-Host "  cd frontend && pnpm dev"