@ECHO OFF
TITLE AI RAMU - Bolo Ramu, Kaam Shuru
cd /d "%~dp0"

echo ======================================================================
echo   [IN] AI RAMU - Bolo Ramu, Kaam Shuru.
echo   Your Indian AI Worker: Desktop, WhatsApp ^& Web Dashboard
echo ======================================================================
echo.
echo [1/3] Initializing workspace and configuration...
node ramu.mjs setup --baseline

echo.
echo [2/3] Starting AI RAMU Gateway in background...
start "AI RAMU Gateway" /min node ramu.mjs gateway run

echo.
echo [3/3] Opening Web Dashboard in browser...
powershell -Command "Start-Sleep -Seconds 4; Start-Process 'http://127.0.0.1:18789/'"

echo.
echo ======================================================================
echo [📱] WhatsApp Pairing: Scan the QR Code Below with Your Phone
echo Open WhatsApp -^> Settings -^> Linked Devices -^> Link a Device
echo ======================================================================
echo.
node ramu.mjs channels login --channel whatsapp

PAUSE
