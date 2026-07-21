# Boon Intelligence -- Create Desktop Shortcuts
# Run this PowerShell script once to create desktop shortcuts
# Right-click -> "Run with PowerShell" or: powershell -ExecutionPolicy Bypass .\create_shortcut.ps1

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$BoonDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$IconExe = "C:\Windows\System32\shell32.dll"

# ── Shortcut 1: Launch Master App (NEW - starts everything) ──────────────
$MasterVbsPath = Join-Path $BoonDir "launch_master.vbs"
$MasterShortcut = $WshShell.CreateShortcut("$DesktopPath\Boon Intelligence.lnk")
$MasterShortcut.TargetPath = "wscript.exe"
$MasterShortcut.Arguments = """$MasterVbsPath"""
$MasterShortcut.Description = "Boon Intelligence - Master App: Dashboard, QR Manager, Sathi Network & more"
$MasterShortcut.WorkingDirectory = $BoonDir
$MasterShortcut.WindowStyle = 1
if (Test-Path $IconExe) { $MasterShortcut.IconLocation = "$IconExe, 43" }
$MasterShortcut.Save()

# ── Shortcut 2: Stop All Services ────────────────────────────────────────
$StopVbsPath = Join-Path $BoonDir "stop_boon.vbs"
$StopShortcut = $WshShell.CreateShortcut("$DesktopPath\Stop Boon.lnk")
$StopShortcut.TargetPath = "wscript.exe"
$StopShortcut.Arguments = """$StopVbsPath"""
$StopShortcut.Description = "Stop all Boon servers"
$StopShortcut.WorkingDirectory = $BoonDir
$StopShortcut.WindowStyle = 1
$StopShortcut.IconLocation = "$IconExe, 27"
$StopShortcut.Save()

# ── Shortcut 3: Open QR Code Manager (URL shortcut) ──────────────────────
$QrUrlPath = "$DesktopPath\QR Code Manager.url"
@"
[InternetShortcut]
URL=http://localhost:3000/qrcode
"@ | Set-Content -Path $QrUrlPath -Encoding ASCII

# ── Shortcut 4: Legacy Boon Launcher (backward compatible) ───────────────
$VbsPath = Join-Path $BoonDir "launch_boon.vbs"
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Boon (Legacy).lnk")
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = """$VbsPath"""
$Shortcut.Description = "Boon - Original launcher (backward compatible)"
$Shortcut.WorkingDirectory = $BoonDir
$Shortcut.WindowStyle = 1
if (Test-Path $IconExe) { $Shortcut.IconLocation = "$IconExe, 43" }
$Shortcut.Save()

# ── Output ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "     Boon Desktop Shortcuts Created!          " -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  [1] Boon Intelligence" -ForegroundColor Cyan
Write-Host "      Double-click to LAUNCH the MASTER APP" -ForegroundColor White
Write-Host "      -> Starts backend + frontend, opens Master Hub" -ForegroundColor Gray
Write-Host ""
Write-Host "  [2] Stop Boon" -ForegroundColor Cyan
Write-Host "      Double-click to STOP all servers" -ForegroundColor White
Write-Host ""
Write-Host "  [3] QR Code Manager" -ForegroundColor Cyan
Write-Host "      Opens QR Manager directly in browser" -ForegroundColor White
Write-Host ""
Write-Host "  [4] Boon (Legacy)" -ForegroundColor Cyan
Write-Host "      Original launcher (backward compat)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Location: $DesktopPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To create the shortcuts, run:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass .\create_shortcut.ps1" -ForegroundColor White
Write-Host ""
