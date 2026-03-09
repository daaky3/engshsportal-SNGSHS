@echo off
REM Serwaah Portal Desktop App Launcher
REM This script starts the app without requiring the full build process

setlocal enabledelayedexpansion

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Node.js is not installed
    echo ========================================
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies... This may take a few minutes.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if Electron is installed
if not exist "node_modules\electron" (
    echo Installing Electron...
    call npm install electron
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install Electron
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Starting Serwaah Portal...
echo ========================================
echo.

REM Start the app
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error starting the app
    pause
    exit /b 1
)
