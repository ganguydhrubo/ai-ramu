@echo off
setlocal EnableExtensions
title AI RAMU - Bolo Ramu, Kaam Shuru
rem Works from any folder: always run from the folder this file lives in.
cd /d "%~dp0"

echo.
echo   AI RAMU  -  Bolo Ramu, Kaam Shuru.
echo.

where node >nul 2>nul
if errorlevel 1 goto :need_node
node -e "const [a,b,c]=process.versions.node.split('.').map(Number);process.exit((a===24&&(b>22||(b===22&&c>=1)))||(a===26&&(b>12||(b===12&&c>=1)))||a>26?0:1)"
if errorlevel 1 goto :need_node

if not exist "node_modules\openclaw\package.json" (
  echo [setup] First run: installing AI RAMU. This can take a few minutes...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :install_failed
)

rem Make the `ramu` command available in any terminal (once).
if not exist "node_modules\.ai-ramu-linked" (
  call npm link --no-audit --no-fund >nul 2>nul && echo linked> "node_modules\.ai-ramu-linked"
)

node bin\ramu.mjs start
set "RAMU_EXIT=%ERRORLEVEL%"
echo.
if not "%RAMU_EXIT%"=="0" echo AI RAMU did not finish starting (code %RAMU_EXIT%). Run "npm run doctor" for details.
pause
exit /b %RAMU_EXIT%

:need_node
echo AI RAMU needs Node.js 24.22.1 or newer (24 LTS).
where winget >nul 2>nul
if errorlevel 1 (
  echo Download it from https://nodejs.org/ then run this file again.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)
choice /C YN /M "Install or upgrade Node.js LTS now with winget"
if errorlevel 2 (
  echo Install Node.js 24 LTS from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)
winget install --exact --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
echo.
echo Node.js installed. Close this window and double-click START_AI_RAMU.bat again.
pause
exit /b 0

:install_failed
echo.
echo Installation failed. Check your internet connection and run this file again.
echo If it keeps failing, run "npm install" in this folder and share the error.
pause
exit /b 1
