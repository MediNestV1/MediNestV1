@echo off
title Auto Push to GitHub

echo ==========================================
echo   MediNest - Auto Push to GitHub
echo ==========================================
echo.

cd /d "c:\Users\hp\OneDrive\Desktop\MediNestV1"

:: Check changes
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if "%STATUS%"=="" (
echo [INFO] No changes to commit. Already up to date!
echo.
pause
exit /b 0
)

echo [CHANGES DETECTED]
git status --short
echo.

:: Stage
echo [1/4] Staging...
git add .

:: Commit
echo [2/4] Committing...
git commit -m "auto: update"

:: Pull latest safely
echo [3/4] Syncing with remote...
git pull origin main --rebase

:: Push
echo [4/4] Pushing...
git push origin main

echo.
echo ==========================================
echo   SUCCESS! Changes pushed!
echo ==========================================
pause
