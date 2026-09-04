# FormPilot — local development launcher
# Run this from the repo root: .\start-dev.ps1
# Opens three windows: backend, frontend, and extension watcher

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  FormPilot Dev Launcher" -ForegroundColor Cyan
Write-Host "  ----------------------" -ForegroundColor DarkGray
Write-Host ""

# ── Backend (FastAPI) ─────────────────────────────────────────────────────────
Write-Host "  Starting Backend  ->  http://localhost:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\backend'; python -m uvicorn app.main:app --reload --port 8001"
) -WindowStyle Normal

Start-Sleep -Milliseconds 800

# ── Frontend (Next.js) ────────────────────────────────────────────────────────
Write-Host "  Starting Frontend ->  http://localhost:3000" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\frontend'; npm run dev"
) -WindowStyle Normal

Start-Sleep -Milliseconds 800

# ── Extension (Webpack watch) ─────────────────────────────────────────────────
Write-Host "  Starting Extension watcher (rebuilds on save)" -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$root\extension'; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "  All three services launched in separate windows." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Load the extension in Chrome:" -ForegroundColor Yellow
Write-Host "    1. Open chrome://extensions" -ForegroundColor White
Write-Host "    2. Enable 'Developer mode' (top-right toggle)" -ForegroundColor White
Write-Host "    3. Click 'Load unpacked'" -ForegroundColor White
Write-Host "    4. Select this folder: $root\extension\dist" -ForegroundColor White
Write-Host ""
Write-Host "  Then visit any job board (Greenhouse, Lever, LinkedIn) to test." -ForegroundColor White
Write-Host ""
