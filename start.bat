@echo off
setlocal enabledelayedexpansion

title MediNest Development Launcher

echo =======================================================
echo          MediNest - SaaS Platform Starter
echo =======================================================
echo.

cd /d "c:\Users\hp\OneDrive\Desktop\MediNestV1"

:: 1. Check Root Dependencies
if not exist "node_modules\" (
    echo [1/3] Root dependencies missing. Installing...
    call npm install
) else (
    echo [1/3] Root dependencies found.
)

:: 2. Check Subproject Dependencies
set SHOULD_INSTALL_SUB=0
if not exist "backend\node_modules\" set SHOULD_INSTALL_SUB=1
if not exist "mnm-nextjs\node_modules\" set SHOULD_INSTALL_SUB=1

if !SHOULD_INSTALL_SUB! equ 1 (
    echo [2/3] Subproject dependencies missing. Installing...
    call npm run install-all
) else (
    echo [2/3] Subproject dependencies found.
)

:: 3. Starting the Servers
echo [3/3] Launching Backend and Frontend...
echo.
echo -------------------------------------------------------
echo  - Frontend: http://localhost:3000
echo  - Backend:  (Check logs below)
echo  - Tip: Press Ctrl+C to stop both servers.
echo -------------------------------------------------------
echo.

:: Small delay and then open browser
start "" "http://localhost:3000"

:: Start the dev environment
npm run dev

pause
