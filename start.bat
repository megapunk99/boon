@echo off
title Boon — Biomedical Waste Intelligence
cd /d "%~dp0"

echo.
echo   ╔════════════════════════════════════════════════╗
echo   ║     🌿 Boon — Biomedical Waste Intelligence    ║
echo   ║  International Conference on Computational     ║
echo   ║  Intelligence ^& Sustainable Innovation         ║
echo   ╚════════════════════════════════════════════════╝
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.12+
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: Install backend deps if needed
echo [1/3] Checking backend dependencies...
cd /d "%~dp0backend"
python -c "import fastapi" 2>nul
if %errorlevel% neq 0 (
    echo       Installing backend dependencies...
    pip install -r requirements.txt -q
) else (
    echo       Backend dependencies already installed.
)

:: Copy .env if not exists
if not exist "..\.env" (
    if exist "..\.env.example" (
        copy "..\.env.example" "..\.env" >nul
        echo       Created .env from .env.example
    )
)

:: Start backend in new window
echo [2/3] Starting backend on http://localhost:8000...
start "Boon Backend" cmd /c "python -m app.main"

:: Wait for backend
echo       Waiting for backend to start...
timeout /t 4 /nobreak >nul

:: Install frontend deps if needed
echo [3/4] Starting frontend on http://localhost:3000...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo       Installing frontend dependencies...
    call npm install --silent
)
start "Boon Frontend" cmd /c "npm run dev"

echo [4/4] Starting scanner on http://localhost:8080...
cd /d "%~dp0scanner"
start "Boon Scanner" cmd /c "python -m http.server 8080"

echo.
echo   ╔════════════════════════════════════════════════╗
echo   ║    🎯 All Services Starting                    ║
echo   ║                                                ║
echo   ║    Frontend:  http://localhost:3000             ║
echo   ║    Backend:   http://localhost:8000             ║
echo   ║    API Docs:  http://localhost:8000/docs        ║
echo   ║    Scanner:   http://localhost:8080             ║
echo   ║    Sāthī:     http://localhost:3000/sathi       ║
echo   ║                                                ║
echo   ║    Press any key to stop all servers...         ║
echo   ╚════════════════════════════════════════════════╝
echo.

pause >nul

:: Kill all Boon-related windows
taskkill /f /fi "WINDOWTITLE eq Boon Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Boon Frontend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Boon Scanner*" >nul 2>&1

echo Servers stopped.
