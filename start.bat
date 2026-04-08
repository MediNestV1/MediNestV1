@echo off
echo =======================================================
echo          Starting MediNest Development Servers
echo =======================================================

echo Installing missing dependencies if any...
call npm install

echo.
echo Launching Backend and Frontend concurrently...
echo You can stop both servers by pressing Ctrl+C in this window.
echo.

npm run dev
