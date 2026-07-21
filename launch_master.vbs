' Boon Intelligence — Master App Launcher
' Double-click this file to start ALL services (backend + frontend) and open the Master Hub.
' Checks dependencies, installs if needed, waits for servers, then opens browser.

Dim objShell, objHttp, objFso, strBoonDir, strCmd
Dim strBackendUrl, strFrontendUrl, i, backendReady, frontendReady

Set objShell = CreateObject("WScript.Shell")
Set objHttp = CreateObject("WinHttp.WinHttpRequest.5.1")
Set objFso = CreateObject("Scripting.FileSystemObject")

strBoonDir = objFso.GetParentFolderName(WScript.ScriptFullName)
strBackendUrl = "http://localhost:8000"
strFrontendUrl = "http://localhost:3000"

' ── Helper Functions ─────────────────────────────────────────────────────

Function RunCommand(cmd)
    Dim objExec
    Set objExec = objShell.Exec("%ComSpec% /c " & cmd)
    Do While objExec.Status = 0
        WScript.Sleep 100
    Loop
    RunCommand = objExec.ExitCode
End Function

Function IsPortListening(url)
    On Error Resume Next
    objHttp.open "GET", url, False
    objHttp.send ""
    If Err.Number = 0 And objHttp.Status = 200 Then
        IsPortListening = True
    Else
        IsPortListening = False
    End If
    On Error GoTo 0
End Function

' ── Step 0: Check Dependencies ───────────────────────────────────────────

' Check Python
Dim pythonCheck
pythonCheck = RunCommand("python --version")
If pythonCheck <> 0 Then
    objShell.Popup "Python is not installed or not in PATH." & vbCrLf & _
        "Please install Python 3.12+ from python.org", 10, "Boon - Missing Python", 16
    WScript.Quit
End If

' Check Node
Dim nodeCheck
nodeCheck = RunCommand("node --version")
If nodeCheck <> 0 Then
    objShell.Popup "Node.js is not installed or not in PATH." & vbCrLf & _
        "Please install Node.js 18+ from nodejs.org", 10, "Boon - Missing Node.js", 16
    WScript.Quit
End If

' Install backend deps if needed
Dim backendDepsReady
backendDepsReady = RunCommand("cd /d """ & strBoonDir & "\backend"" && python -c ""import fastapi, qrcode"" 2>nul")
If backendDepsReady <> 0 Then
    objShell.Popup "Installing backend dependencies..." & vbCrLf & _
        "This may take a minute on first launch.", 3, "Boon Intelligence", 64
    Dim pipResult
    pipResult = RunCommand("cd /d """ & strBoonDir & "\backend"" && pip install -r requirements.txt -q")
    If pipResult <> 0 Then
        objShell.Popup "Failed to install backend dependencies." & vbCrLf & _
            "Try running: pip install -r requirements.txt", 10, "Boon - Error", 16
        WScript.Quit
    End If
End If

' Install frontend deps if needed
If Not objFso.FolderExists(strBoonDir & "\frontend\node_modules") Then
    objShell.Popup "Installing frontend dependencies..." & vbCrLf & _
        "This may take a minute on first launch.", 3, "Boon Intelligence", 64
    Dim npmResult
    npmResult = RunCommand("cd /d """ & strBoonDir & "\frontend"" && npm install --no-optional")
    If npmResult <> 0 Then
        objShell.Popup "Failed to install frontend dependencies." & vbCrLf & _
            "Try running: npm install", 10, "Boon - Error", 16
        WScript.Quit
    End If
End If

' ── Step 1: Start Backend ────────────────────────────────────────────────

strCmd = "cmd.exe /c ""cd /d """ & strBoonDir & "\backend"" && python -m app.main"""
objShell.Run strCmd, 0, False

' Wait for backend to be ready (poll up to 40 seconds)
backendReady = False
For i = 1 To 40
    WScript.Sleep 1000
    If IsPortListening(strBackendUrl & "/health") Then
        backendReady = True
        Exit For
    End If
Next

If Not backendReady Then
    objShell.Popup "Backend failed to start within 40 seconds." & vbCrLf & _
        "Check that port 8000 is not in use.", 5, "Boon Intelligence - Error", 16
End If

' ── Step 2: Start Frontend ───────────────────────────────────────────────

strCmd = "cmd.exe /c ""cd /d """ & strBoonDir & "\frontend"" && npm run dev"""
objShell.Run strCmd, 0, False

' Wait for frontend to be ready (poll up to 40 seconds)
frontendReady = False
For i = 1 To 40
    WScript.Sleep 1000
    If IsPortListening(strFrontendUrl) Then
        frontendReady = True
        Exit For
    End If
Next

' ── Step 3: Open Browser to Master Hub ───────────────────────────────────

WScript.Sleep 500

If frontendReady Then
    objShell.Run strFrontendUrl, 1, False
Else
    objShell.Popup "Frontend is taking longer than expected." & vbCrLf & _
        "Open http://localhost:3000 manually in your browser.", 5, "Boon Intelligence", 48
    objShell.Run strFrontendUrl, 1, False
End If

' ── Done ─────────────────────────────────────────────────────────────────

Dim strBackendStatus
If backendReady Then strBackendStatus = "Ready" Else strBackendStatus = "Starting"

objShell.Popup "Boon Intelligence is running!" & vbCrLf & vbCrLf & _
    "        Master Hub:  http://localhost:3000" & vbCrLf & _
    "     QR Code Manager: http://localhost:3000/qrcode" & vbCrLf & _
    "   Sathi Network:    http://localhost:3000/sathi" & vbCrLf & _
    "        API Docs:     http://localhost:8000/docs" & vbCrLf & vbCrLf & _
    "  Backend: " & strBackendStatus & "  •  Frontend: Ready" & vbCrLf & vbCrLf & _
    "  To stop: Double-click 'Stop Boon' on desktop", 8, "Boon Intelligence - Ready", 64

Set objHttp = Nothing
Set objShell = Nothing
Set objFso = Nothing
