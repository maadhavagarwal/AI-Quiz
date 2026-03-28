@echo off
REM Startup script for AI MCQ Maker on Windows

echo.
echo 🚀 Starting AI MCQ Maker...
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Download from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js version: %NODE_VERSION%
echo.

REM Check backend .env
if not exist "backend\.env.local" (
    echo ⚠️  backend\.env.local not found
    echo    Create it with MongoDB URI and Gemini API key
    echo    See ENV_SETUP.md for details
)

REM Check frontend .env
if not exist "frontend\.env.local" (
    echo ⚠️  frontend\.env.local not found
    echo    Create it with NEXT_PUBLIC_API_URL
)

echo.
echo 📦 Installing dependencies...

REM Backend
if not exist "backend\node_modules\" (
    echo   → Backend...
    cd backend
    call npm install
    cd ..
)

REM Frontend
if not exist "frontend\node_modules\" (
    echo   → Frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ✅ Setup complete!
echo.
echo 📌 Next steps:
echo    1. Terminal 1: cd backend ^&^& npm run start
echo    2. Terminal 2: cd frontend ^&^& npm run dev
echo    3. Open http://localhost:3000
echo.
echo 🎓 Happy learning!
echo.
pause
