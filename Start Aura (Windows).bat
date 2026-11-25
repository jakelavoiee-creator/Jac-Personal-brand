@echo off
REM Double-click to start Aura Studio on Windows. Keep this window open while you use it.
cd /d "%~dp0aura-studio"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed yet.
  echo Install the LTS version from https://nodejs.org, then double-click this file again.
  start "" https://nodejs.org
  pause
  exit /b 1
)
node scripts\start.mjs
if errorlevel 1 pause
