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
if not exist node_modules (
  echo First start: installing Aura - takes a few minutes, only once...
  call npm install
  if errorlevel 1 ( echo Install failed. & pause & exit /b 1 )
)
echo.
echo Starting Aura Studio... it opens in your browser at http://localhost:5173
echo Leave this window open while you work. Close it to stop Aura.
start "" cmd /c "timeout /t 6 >nul & start http://localhost:5173"
call npm run dev -- --port 5173
