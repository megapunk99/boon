@echo off
title Boon + Sathi — All Services
cd /d "%~dp0"

setlocal enabledelayedexpansion

:: ── Color codes ───────────────────────────────────────────────────────────
set GREEN=[92m
set CYAN=[96m
set YELLOW=[93m
set RED=[91m
set RESET=[0m

echo.
echo   %CYAN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo   %CYAN%║                                                              ║%RESET%
echo   %CYAN%║     %GREEN%🌿 Boon + Sāthī — All Services%RESET%                     %CYAN%║%RESET%
echo   %CYAN%║     %YELLOW%Biomedical Waste Intelligence Network%RESET%              %CYAN%║%RESET%
echo   %CYAN%║                                                              ║%RESET%
echo   %CYAN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

:: ═════════════════════════════════════════════════════════════════════════
:: STEP 0 — Check Dependencies
:: ═════════════════════════════════════════════════════════════════════════

echo %YELLOW%[1/5]%RESET% Checking dependencies...

:: Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%RESET% Python not found. Install Python 3.12+ from python.org
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo        Python %PY_VER% found ✓

:: Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%RESET% Node.js not found. Install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node --version') do set NODE_VER=%%v
echo        Node.js %NODE_VER% found ✓

:: ═════════════════════════════════════════════════════════════════════════
:: STEP 1 — Install Backend Dependencies
:: ═════════════════════════════════════════════════════════════════════════

echo %YELLOW%[2/5]%RESET% Setting up backend...

cd /d "%~dp0backend"

python -c "import fastapi, qrcode, uvicorn" 2>nul
if %errorlevel% neq 0 (
    echo        Installing backend dependencies (first launch)...
    pip install -r requirements.txt -q
    if !errorlevel! neq 0 (
        echo %RED%[ERROR]%RESET% Failed to install backend dependencies
        pause
        exit /b 1
    )
    echo        Dependencies installed ✓
) else (
    echo        Backend dependencies already installed ✓
)

:: ═════════════════════════════════════════════════════════════════════════
:: STEP 2 — Install Frontend Dependencies
:: ═════════════════════════════════════════════════════════════════════════

echo %YELLOW%[3/5]%RESET% Setting up frontend...

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo        Installing frontend dependencies (first launch)...
    call npm install --silent
    if !errorlevel! neq 0 (
        echo %RED%[ERROR]%RESET% Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo        Dependencies installed ✓
) else (
    echo        Frontend dependencies already installed ✓
)

:: ═════════════════════════════════════════════════════════════════════════
:: STEP 3 — Launch All Services
:: ═════════════════════════════════════════════════════════════════════════

echo %YELLOW%[4/5]%RESET% Launching services...

:: ── Backend (FastAPI on :8000) ────────────────────────────────────────────
echo        Starting backend on %GREEN%http://localhost:8000%RESET%
cd /d "%~dp0backend"
start "Boon Backend" cmd /c "title Boon Backend && python -m app.main"

:: ── Scanner App (redirect to main app — optional) ─────────────────────────
echo        Scanner integrated into main app at %GREEN%http://localhost:3000/qrcode%RESET%
echo        (Legacy server on port 8080 is no longer needed; starts a redirect page)

:: ── Frontend (Vite dev server on :3000) ───────────────────────────────────
echo        Starting frontend on %GREEN%http://localhost:3000%RESET%
cd /d "%~dp0frontend"
start "Boon Frontend" cmd /c "title Boon Frontend && npm run dev"

:: ═════════════════════════════════════════════════════════════════════════
:: STEP 4 — Wait for services and open browser
:: ═════════════════════════════════════════════════════════════════════════

echo %YELLOW%[5/5]%RESET% Waiting for services to start...

:: Wait for backend (poll up to 20 seconds)
set BACKEND_READY=0
for /l %%i in (1,1,20) do (
    >nul 2>&1 (
        powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing).StatusCode -eq 200 } catch { $false }"
    ) && (
        set BACKEND_READY=1
        goto :backend_ok
    )
    timeout /t 1 /nobreak >nul
)
:backend_ok

if !BACKEND_READY! equ 1 (
    echo        %GREEN%Backend ready ✓%RESET%
) else (
    echo        %YELLOW%Backend may still be starting...%RESET%
)

:: Wait for frontend (poll up to 20 seconds)
set FRONTEND_READY=0
for /l %%i in (1,1,20) do (
    >nul 2>&1 (
        powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing).StatusCode -eq 200 } catch { $false }"
    ) && (
        set FRONTEND_READY=1
        goto :frontend_ok
    )
    timeout /t 1 /nobreak >nul
)
:frontend_ok

if !FRONTEND_READY! equ 1 (
    echo        %GREEN%Frontend ready ✓%RESET%
) else (
    echo        %YELLOW%Frontend may still be starting...%RESET%
)

:: Open browser tabs
timeout /t 2 /nobreak >nul
start http://localhost:3000
start http://localhost:8080
start http://localhost:8000/docs

:: ═════════════════════════════════════════════════════════════════════════
:: DONE — Show Dashboard
:: ═════════════════════════════════════════════════════════════════════════

cls
echo.
echo   %GREEN%╔══════════════════════════════════════════════════════════════╗%RESET%
echo   %GREEN%║                🎯  ALL SERVICES RUNNING                      ║%RESET%
echo   %GREEN%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.
echo   %CYAN%Frontend (Dashboard)%RESET
echo     %GREEN%http://localhost:3000%RESET         Boon Main Dashboard
echo     %GREEN%http://localhost:3000/sathi%RESET    Sāthī Network Dashboard
echo.
echo   %CYAN%Backend (API)%RESET
echo     %GREEN%http://localhost:8000%RESET         API Root
echo     %GREEN%http://localhost:8000/docs%RESET    Interactive API Docs (Swagger)
echo     %GREEN%http://localhost:8000/redoc%RESET   API Docs (ReDoc)
echo.
echo   %CYAN%QR Code Manager (Integrated)%RESET
echo     %GREEN%http://localhost:3000/qrcode%RESET  QR generation, barcode verify, scan history
echo.
echo   %YELLOW%╔══════════════════════════════════════════════════════════════╗%RESET%
echo   %YELLOW%║  To stop all services:                                       ║%RESET%
echo   %YELLOW%║    1. Close the terminal windows, OR                         ║%RESET%
echo   %YELLOW%║    2. Double-click 'stop_boon.vbs' in the boon folder        ║%RESET%
echo   %YELLOW%║    3. Press any key in THIS window to kill all processes      ║%RESET%
echo   %YELLOW%╚══════════════════════════════════════════════════════════════╝%RESET%
echo.

pause >nul

:: ── Clean Shutdown ────────────────────────────────────────────────────────
echo.
echo %YELLOW%Shutting down all services...%RESET%

:: Kill by window title
taskkill /f /fi "WINDOWTITLE eq Boon Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Boon Frontend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Boon Scanner*" >nul 2>&1

:: Also kill any stray python/node serving our ports
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8000') do (
    taskkill /f /pid %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8080') do (
    taskkill /f /pid %%p >nul 2>&1
)

echo %GREEN%All services stopped. Goodbye!%RESET%
timeout /t 2 /nobreak >nul
