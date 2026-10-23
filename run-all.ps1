$basedir = Split-Path $MyInvocation.MyCommand.Definition -Parent
Set-Location $basedir

Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "  🇮🇳 AI RAMU - Bolo Ramu, Kaam Shuru.  " -ForegroundColor Yellow
Write-Host "  Your Indian AI Worker: Desktop, WhatsApp & Web Dashboard" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Yellow

Write-Host "`n[1/3] Initializing workspace and configuration..." -ForegroundColor Green
node ramu.mjs setup --baseline

Write-Host "`n[2/3] Starting AI RAMU Gateway in background..." -ForegroundColor Green
Start-Process node -ArgumentList "ramu.mjs", "gateway", "run" -WindowStyle Minimized

Write-Host "`n[3/3] Opening Web Dashboard in browser..." -ForegroundColor Green
Start-Sleep -Seconds 4
Start-Process "http://127.0.0.1:18789/"

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "📱 WhatsApp Pairing: Scan the QR Code Below with Your Phone" -ForegroundColor Yellow
Write-Host "Open WhatsApp -> Settings -> Linked Devices -> Link a Device" -ForegroundColor DarkGray
Write-Host "======================================================================`n" -ForegroundColor Green

node ramu.mjs channels login --channel whatsapp
