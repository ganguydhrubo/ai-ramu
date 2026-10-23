@echo off
setlocal
title AI RAMU Dashboard
cd /d "%~dp0"
rem Opens the dashboard; starts the gateway first only if it is not running.
where node >nul 2>nul || (echo Node.js not found. Run START_AI_RAMU.bat first. & pause & exit /b 1)
if not exist "node_modules\openclaw\package.json" (echo AI RAMU is not installed yet. Run START_AI_RAMU.bat first. & pause & exit /b 1)
node bin\ramu.mjs start
if errorlevel 1 pause
