$WS = New-Object -ComObject WScript.Shell
$SC = $WS.CreateShortcut("$env:USERPROFILE\Desktop\Gestion BDD OCP.lnk")
$SC.TargetPath = "wscript.exe"
$SC.Arguments = "`"$env:USERPROFILE\Desktop\Gestion BDD OCP.vbs`""
$SC.IconLocation = "C:\Windows\System32\imageres.dll,109"
$SC.Description = "Gestion de Bases de Donnees - OCP"
$SC.Save()
Write-Host "Raccourci mis a jour avec icone 109!"
