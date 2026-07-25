@echo off
REM Captures demo fixtures into public\demo from a locally running backend.
REM Start the backend first (npm run dev:api), then double-click or run this file.
setlocal
node "%~dp0capture-demo-data.mjs" %*
if errorlevel 1 (
  echo.
  echo Capture failed. Make sure the backend is running on http://127.0.0.1:8080
  echo or pass a different host, for example:
  echo   capture-demo-data.bat --base-url=http://localhost:8080
)
endlocal
pause
