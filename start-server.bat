@echo off
title Serwaah Portal Server
echo.
echo ======================================
echo   Serwaah Portal - PWA Server
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js found
echo ✓ Starting server...
echo.

REM Start the server
node server.js

pause
