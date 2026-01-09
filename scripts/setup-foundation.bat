@echo off
echo 🚀 Starting Foundation Setup...

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)

echo 📦 Installing Dependencies...
call npm install

echo 🛠️ Configuring Husky...
call npm run prepare

echo 📁 Creating Storage Directories...
if not exist "storage" mkdir storage
if not exist "storage\auth" mkdir storage\auth
if not exist "storage\images" mkdir storage\images
if not exist "storage\reports" mkdir storage\reports
if not exist "storage\backups" mkdir storage\backups
if not exist "storage\logs" mkdir storage\logs
if not exist "storage\temp" mkdir storage\temp

echo ✅ Setup Complete!
echo Run 'npm run dev' to start.
