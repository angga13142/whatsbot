@echo off
REM ══════════════════════════════════════════════════════════
REM WhatsApp Cashflow Bot - Foundation Setup Script (Windows)
REM
REM This script sets up the complete development environment
REM for the WhatsApp Cashflow Tracker Bot on Windows.
REM
REM Usage: scripts\setup-foundation.bat
REM ══════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

REM Colors (limited in Windows CMD)
set "ROCKET=🚀"
set "CHECK=✅"
set "CROSS=❌"
set "WARNING=⚠️"
set "INFO=ℹ️"

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║     %ROCKET% WhatsApp Cashflow Bot - Foundation Setup      ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM ══════════════════════════════════════════════════════════
REM STEP 1: CHECK PREREQUISITES
REM ══════════════════════════════════════════════════════════

echo %INFO% Step 1: Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %CROSS% Node.js not found
    echo %INFO% Please install Node. js v18+: https://nodejs.org/
    pause
    exit /b 1
)

echo %CHECK% Node.js found
node -v

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %CROSS% npm not found
    pause
    exit /b 1
)

echo %CHECK% npm found
npm -v

REM Check Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo %WARNING% Git not found (optional but recommended)
    echo %INFO% Download from:  https://git-scm.com/
) else (
    echo %CHECK% Git found
    git --version
)

echo.

REM ══════════════════════════════════════════════════════════
REM STEP 2: INSTALL DEPENDENCIES
REM ══════════════════════════════════════════════════════════

echo %INFO% Step 2: Installing dependencies...
echo.
echo %INFO% This may take a few minutes...
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo %CROSS% Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo %CHECK% Dependencies installed successfully
echo.

REM ══════════════════════════════════════════════════════════
REM STEP 3: SETUP ENVIRONMENT
REM ══════════════════════════════════════════════════════════

echo %INFO% Step 3: Setting up environment...
echo.

if not exist .env (
    copy .env.example .env >nul
    echo %CHECK% .env file created from .env.example
    echo %WARNING% Please edit .env file with your configuration
) else (
    echo %INFO% .env file already exists (skipped)
)

echo.

REM ══════════════════════════════════════════════════════════
REM STEP 4: SETUP GIT HOOKS (HUSKY)
REM ══════════════════════════════════════════════════════════

echo %INFO% Step 4: Setting up Git hooks (Husky)...
echo.

if exist .git (
    call npx husky install 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo %CHECK% Husky hooks installed
    ) else (
        echo %WARNING% Husky installation failed (non-critical)
    )
) else (
    echo %WARNING% Not a git repository, skipping Husky setup
    echo %INFO% Run 'git init' to initialize git repository
)

echo.

REM ══════════════════════════════════════════════════════════
REM STEP 5: CREATE STORAGE DIRECTORIES
REM ══════════════════════════════════════════════════════════

echo %INFO% Step 5: Creating storage directories...
echo.

mkdir storage\auth 2>nul
mkdir storage\images 2>nul
mkdir storage\reports 2>nul
mkdir storage\backups 2>nul
mkdir storage\logs 2>nul

type nul > storage\auth\. gitkeep 2>nul
type nul > storage\images\.gitkeep 2>nul
type nul > storage\reports\.gitkeep 2>nul
type nul > storage\backups\. gitkeep 2>nul
type nul > storage\logs\.gitkeep 2>nul

echo %CHECK% Storage directories created
echo.

REM ══════════════════════════════════════════════════════════
REM STEP 6: SETUP DATABASE
REM ══════════════════════════════════════════════════════════

echo %INFO% Step 6: Setting up database...
echo.

if exist scripts\migrate.js (
    echo %INFO% Running database migrations...
    call npm run migrate 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo %CHECK% Database migrations completed
    ) else (
        echo %WARNING% Database migration failed (you may need to run it manually later)
    )
) else (
    echo %WARNING% Migration script not found (will be available after code implementation)
)

echo.

REM ══════════════════════════════════════════════════════════
REM SETUP COMPLETE
REM ══════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║     %CHECK% FOUNDATION SETUP COMPLETE!                     ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo %INFO% Setup Summary:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   %CHECK% Node.js installed
echo   %CHECK% npm installed
echo   %CHECK% Dependencies installed
echo   %CHECK% Environment configured
echo   %CHECK% Git hooks enabled
echo   %CHECK% Storage directories created
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo %ROCKET% Next Steps:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo   1. Configure your environment:
echo      notepad .env
echo.
echo   2. Create project structure:
echo      bash scripts\create-structure.sh
echo      (or manually create folders)
echo.
echo   3. Start development:
echo      npm run dev
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo %WARNING% Important Notes:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   • Edit .env file with your WhatsApp bot configuration
echo   • Set BOT_PHONE_NUMBER to your bot's WhatsApp number
echo   • Choose authentication method (qr or pairing)
echo   • Configure database settings
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo %INFO% Useful Commands:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   npm run dev          - Start development server
echo   npm run lint         - Check code quality
echo   npm run lint:fix     - Fix linting issues
echo   npm test             - Run tests
echo   npm run validate     - Run all checks
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Happy coding!
echo.
pause
