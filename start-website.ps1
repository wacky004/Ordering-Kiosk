# Starts the kiosk website and opens the browser.
# Run it from PowerShell:  .\start-website.ps1
# If PowerShell blocks scripts, run instead:  powershell -ExecutionPolicy Bypass -File .\start-website.ps1

Set-Location -LiteralPath $PSScriptRoot

Write-Host ""
Write-Host "  McDonald's Kiosk - starting the website" -ForegroundColor Yellow
Write-Host "  ======================================="
Write-Host ("  Folder: " + (Get-Location).Path)
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "  ERROR: Node.js was not found. Install the LTS version from https://nodejs.org" -ForegroundColor Red
  Write-Host ""
  Read-Host "Press Enter to close"
  exit 1
}

Write-Host ("  Node.js: " + (node --version))

if (-not (Test-Path "node_modules\express")) {
  Write-Host "  First run detected - installing dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed. See the messages above." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
  }
}

Write-Host ""
Write-Host "  Starting the server. Your browser will open automatically."
Write-Host "  Keep this window open. Press Ctrl+C to stop."
Write-Host ""

node server.js

Write-Host ""
Write-Host "  The server has stopped."
Read-Host "Press Enter to close"
