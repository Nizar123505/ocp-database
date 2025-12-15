$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Gestion BDD OCP.lnk")
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$env:USERPROFILE\Desktop\Gestion BDD OCP.vbs`""
$Shortcut.IconLocation = "C:\Windows\System32\imageres.dll,109"
$Shortcut.Description = "Gestion de Bases de Donnees - OCP"
$Shortcut.Save()
Write-Host "Raccourci cree avec succes!"






