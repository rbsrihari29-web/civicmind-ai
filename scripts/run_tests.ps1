# CivicMind AI - Run Automated Test Suite
Write-Host "Running CivicMind AI PyTest Test Suite..." -ForegroundColor Cyan
$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$env:PYTHONPATH = $backendDir
Set-Location $root
py -3.14 -m pytest backend/tests -v
