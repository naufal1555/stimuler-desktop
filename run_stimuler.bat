@echo off
title Stimuler AI - Desktop PC Launcher
echo ========================================================
echo        Starting Stimuler AI - Desktop PC Application
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Dedicated AI Backend Engine on Port 8765...
start "Stimuler AI - Backend" cmd /k "cd /d ""%~dp0backend"" && python app.py"

echo [2/2] Launching Native Desktop App (Electron)...
timeout /t 3 /nobreak >nul

cd /d "%~dp0app"
npm run electron:dev
