@echo off
rem Double-click this file to start the kiosk website.
rem The server opens your browser automatically once it is ready.
setlocal
title McDo Kiosk - Website

pushd "%~dp0"

echo.
echo   McDonald's Kiosk - starting the website
echo   =======================================
echo   Folder: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   ERROR: Node.js was not found on this computer.
  echo.
  echo   Install the LTS version from https://nodejs.org
  echo   then double-click this file again.
  echo.
  popd
  pause
  exit /b 1
)

echo   Node.js:
node --version
echo.

if not exist "node_modules\express" (
  echo   First run detected - installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo.
    echo   ERROR: "npm install" failed. See the messages above.
    echo.
    popd
    pause
    exit /b 1
  )
  echo.
)

echo   Starting the server. Your browser will open automatically.
echo   KEEP THIS WINDOW OPEN while using the website.
echo   Press Ctrl+C in this window to stop the server.
echo.

node server.js

echo.
echo   The server has stopped.
echo.
popd
pause
