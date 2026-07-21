' Boon Scanner — Redirect to Master App
' The standalone scanner has been integrated into the Boon Intelligence Dashboard.
' Double-click this to open the QR Code Manager in the main app.

Dim objShell, objFso
Set objShell = CreateObject("WScript.Shell")
Set objFso = CreateObject("Scripting.FileSystemObject")

objShell.Run "http://localhost:3000/qrcode", 1, False

objShell.Popup "Opening QR Code Manager in the main dashboard..." & vbCrLf & vbCrLf & _
    "The standalone scanner is now integrated at:" & vbCrLf & _
    "  http://localhost:3000/qrcode" & vbCrLf & vbCrLf & _
    "Start the main app with:" & vbCrLf & _
    "  Double-click 'Boon' on your desktop", 3, "Boon Scanner - Redirecting", 64

Set objShell = Nothing
Set objFso = Nothing
