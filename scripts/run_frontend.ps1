# CivicMind AI - Start Frontend Dev Server
Write-Host "Starting CivicMind AI Vite React Frontend on http://localhost:5173..." -ForegroundColor Cyan
$root = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $root "frontend"
Set-Location $frontendDir
npm run dev
