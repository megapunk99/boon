' Boon — Stop Server Processes
' Double-click this file to stop all Boon-related background processes.
' Kills Python and Node.js processes that may be running the servers.

Dim objShell, objFso, strBoonDir, strMsg

Set objShell = CreateObject("WScript.Shell")
Set objFso = CreateObject("Scripting.FileSystemObject")
strBoonDir = objFso.GetParentFolderName(WScript.ScriptFullName)

' Kill Python processes (runs backend)
objShell.Run "taskkill /f /im python.exe", 0, True

' Kill Node.js processes (runs frontend)
objShell.Run "taskkill /f /im node.exe", 0, True

WScript.Sleep 1000

' Show confirmation
strMsg = "Boon servers have been stopped." & vbCrLf & vbCrLf & _
    "You can safely close this window." & vbCrLf & vbCrLf & _
    "To start Boon again, double-click the 'Boon' shortcut on your desktop."

objShell.Popup strMsg, 5, "Boon - Stopped", 64

Set objShell = Nothing
Set objFso = Nothing
