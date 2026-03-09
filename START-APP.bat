@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    color 0C
    cls
    echo.
    echo ====================================================
    echo   SERWAAH PORTAL - SETUP REQUIRED
    echo ====================================================
    echo.
    echo Node.js is not installed on this computer.
    echo.
    echo To use Serwaah Portal, you need to:
    echo.
    echo 1. Download Node.js from: https://nodejs.org/
    echo 2. Install Node.js (choose LTS version)
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    echo ====================================================
    echo.
    pause
    exit /b 1
)

REM Setup and run
if not exist "node_modules" (
    color 0A
    cls
    echo.
    echo ====================================================
    echo   Installing Serwaah Portal (First Time)
    echo ====================================================
    echo.
    echo This will take a few minutes...
    echo.
    call npm install --legacy-peer-deps >nul 2>&1
    echo Installation complete!
    echo.
)

color 0B
cls
echo.
echo ====================================================
echo   SERWAAH PORTAL
echo ====================================================
echo.
echo Starting application...
echo.

call npm start

color 0C
echo.
echo The application has closed.
echo.
pause
