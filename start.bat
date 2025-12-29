@echo off
REM Game Center Website Startup Script for Windows
REM This script will check for dependencies and start the development server

echo.
echo 🎮 Game Center - Starting...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo 📥 Please install Node.js from https://nodejs.org/
    echo    Download the LTS version for Windows
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js is installed
    node --version
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
) else (
    echo ✅ npm is installed
    npm --version
)

echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🚀 Starting development server...
echo.
echo 📌 The website will be available at:
echo    http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Clear Next.js cache
if exist ".next" rmdir /s /q .next

REM Start the development server
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Server failed to start!
    echo 🔄 Attempting to fix by reinstalling dependencies...
    echo    (This might take a minute)
    
    if exist "node_modules" rmdir /s /q node_modules
    if exist "package-lock.json" del package-lock.json
    
    call npm install
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dependencies reinstalled successfully.
        echo 🚀 Restarting server...
        call npm run dev
    ) else (
        echo ❌ Failed to reinstall dependencies.
        pause
        exit /b 1
    )
)
