$ErrorActionPreference = "Stop"

$files = @(
  "src\test-shims.d.ts",
  "src\pages\DayDetailPage.tsx"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Remove-Item $file -Force
    Write-Host "removed $file"
  }
}

Write-Host "ERI DI-ERY Phase 4.3 cleanup done."
