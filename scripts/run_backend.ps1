# CivicMind AI - Start Backend Server
Write-Host "Starting CivicMind AI FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan
$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$env:PYTHONPATH = $backendDir
Set-Location $backendDir
py -3.14 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
