@echo off
echo ========================================
echo   MediNest Git Sync Utility
echo ========================================

echo.
echo [1/6] Checking Git Status...
git status

echo.
echo [2/6] Current Branch:
git branch --show-current

echo.
echo [3/6] Staging Changes...
git add .

echo.
set /p commit_msg="Enter commit message (or press enter for default): "
if "%commit_msg%"=="" set commit_msg="UI overhaul and Tailwind 4 integration"

echo [4/6] Committing...
git commit -m %commit_msg%

echo.
echo [5/6] Pulling Latest (Rebase mode)...
git pull --rebase origin main

echo.
echo [6/6] Pushing to Origin...
git push origin main

echo.
echo ========================================
echo   Sync Complete!
echo ========================================
pause
