@echo off
title Boon Scanner — Redirecting to Master App
cd /d "%~dp0"

echo.
echo   ╔════════════════════════════════════════════════╗
echo   ║  🌿 Boon Scanner Has Moved                     ║
echo   ║                                                ║
echo   ║  The scanner is now integrated into the         ║
echo   ║  main Boon Intelligence Dashboard.              ║
echo   ║                                                ║
echo   ║  Opening QR Code Manager...                    ║
echo   ╚════════════════════════════════════════════════╝
echo.

start http://localhost:3000/qrcode
echo.
echo   Opened http://localhost:3000/qrcode in your browser.
echo   The standalone scanner server on port 8080 is no longer needed.
echo.
pause
