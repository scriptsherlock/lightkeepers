@echo off
rem Lightkeepers booth: starts the local site (works without wifi) and opens it full screen.
rem Double-click to start. To stop: close the browser (Alt+F4), then close the server window.
title Lightkeepers booth
cd /d "%~dp0.."

rem Build every time (a few seconds), so the booth always shows the latest version.
echo Getting Lightkeepers ready...
call npm run build >nul 2>&1

rem The server runs in its own small window. Keep it open while the booth is running.
start "Lightkeepers server - keep this open" /min cmd /k "npm run preview"
timeout /t 5 /nobreak >nul

set "URL=http://127.0.0.1:4200/"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%CHROME%" (
  start "" "%CHROME%" --app=%URL% --start-fullscreen
) else if exist "%EDGE%" (
  start "" "%EDGE%" --app=%URL% --start-fullscreen
) else (
  start "" %URL%
)
