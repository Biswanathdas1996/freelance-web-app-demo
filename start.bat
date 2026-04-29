@echo off
setlocal
cd /d "%~dp0"

echo Starting backend (port 9001) and frontend (port 9000) in new windows...
echo.

start "Freelance API [9001]" cmd /k "cd /d ""%~dp0backend"" && npm start"
start "Freelance UI [9000]" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Launched. Close this window when you like; the app runs in the other two.
exit /b 0
