param(
  [string]$BaseUrl = "http://localhost:8787",
  [string]$Token = "change-me-before-testing"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "1) health"
Invoke-RestMethod `
  -Method Get `
  -Uri "$BaseUrl/api/health" |
  ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "2) authenticated snapshot"
$headers = @{
  Authorization = "Bearer $Token"
}

$result = Invoke-RestMethod `
  -Method Get `
  -Headers $headers `
  -Uri "$BaseUrl/api/v1/snapshot"

$result |
  ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "ERI DI-ERY Worker smoke test passed."
