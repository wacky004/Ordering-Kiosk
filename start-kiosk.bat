@echo off
rem Opens the offline single-file kiosk in a fullscreen app-style window.
setlocal
set "HERE=%~dp0"
set "FILE=%HERE%dist\mcdo-kiosk-desktop.html"

echo.
echo   McDonald's Kiosk - desktop mode
echo   ---------------------------------
if not exist "%FILE%" (
  echo   Offline build not found at:
  echo     %FILE%
  echo.
  echo   Run this first:  npm run build:single
  echo.
  pause
  exit /b 1
)

set "FILEURL=%FILE:\=/%"
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if defined BROWSER (
  echo   Opening fullscreen with:
  echo     %BROWSER%
  echo   Press Alt+F4 to close.
  start "" "%BROWSER%" --app="file:///%FILEURL%" --kiosk --user-data-dir="%TEMP%\mcdo-kiosk-profile"
) else (
  echo   Chrome/Edge not found - opening in your default browser instead.
  start "" "%FILE%"
)
echo.
endlocal
