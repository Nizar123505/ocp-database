# ===========================================
# SCRIPT DE DEPLOIEMENT AUTOMATIQUE OCP
# ===========================================
# Ce script deploie l'application sur Render
# Superuser: Nizar / nizar
# ===========================================

$Host.UI.RawUI.WindowTitle = "Deploiement OCP sur Render"
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     DEPLOIEMENT AUTOMATIQUE - Application OCP sur Render     ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║     Superuser: Nizar / Nizar@OCP2025!                        ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Aller dans le dossier du projet
Set-Location $PSScriptRoot

# ===========================================
# ETAPE 1: Configuration GitHub
# ===========================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ETAPE 1: Configuration GitHub" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$githubUser = Read-Host "Entre ton nom d'utilisateur GitHub"
$repoName = Read-Host "Entre le nom du repository (ex: ocp-app)"

Write-Host ""
Write-Host "[INFO] Repository: https://github.com/$githubUser/$repoName" -ForegroundColor Yellow
Write-Host ""

# ===========================================
# ETAPE 2: Creer le repository sur GitHub
# ===========================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ETAPE 2: Creer le repository sur GitHub" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Je vais ouvrir GitHub. Cree le repository avec ces parametres:" -ForegroundColor White
Write-Host ""
Write-Host "   Nom: $repoName" -ForegroundColor Green
Write-Host "   Visibilite: PUBLIC" -ForegroundColor Green
Write-Host "   NE PAS initialiser avec README" -ForegroundColor Red
Write-Host ""

Start-Process "https://github.com/new"
Write-Host "Appuie sur ENTREE une fois le repository cree..." -ForegroundColor Yellow
Read-Host

# ===========================================
# ETAPE 3: Pousser le code sur GitHub
# ===========================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ETAPE 3: Envoi du code sur GitHub" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$gitPath = "C:\Program Files\Git\bin\git.exe"

Write-Host "[1/3] Configuration du remote..." -ForegroundColor White
& $gitPath remote remove origin 2>$null
& $gitPath remote add origin "https://github.com/$githubUser/$repoName.git"

Write-Host "[2/3] Preparation de la branche main..." -ForegroundColor White
& $gitPath branch -M main

Write-Host "[3/3] Envoi du code (une fenetre de connexion GitHub peut apparaitre)..." -ForegroundColor White
& $gitPath push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Code envoye sur GitHub avec succes!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERREUR] Probleme lors de l'envoi. Verifie tes identifiants GitHub." -ForegroundColor Red
    Write-Host "Essaie de te connecter a GitHub dans ton navigateur d'abord." -ForegroundColor Yellow
    Read-Host "Appuie sur ENTREE pour reessayer"
    & $gitPath push -u origin main
}

# ===========================================
# ETAPE 4: Deploiement sur Render
# ===========================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ETAPE 4: Deploiement sur Render" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Je vais ouvrir Render. Suis ces etapes:" -ForegroundColor White
Write-Host ""
Write-Host "   1. Connecte-toi ou cree un compte" -ForegroundColor Yellow
Write-Host "   2. Clique sur 'New' > 'Blueprint'" -ForegroundColor Yellow
Write-Host "   3. Connecte ton compte GitHub" -ForegroundColor Yellow
Write-Host "   4. Selectionne le repository: $repoName" -ForegroundColor Yellow
Write-Host "   5. Clique sur 'Apply'" -ForegroundColor Yellow
Write-Host "   6. Attends 5-10 minutes" -ForegroundColor Yellow
Write-Host ""

Start-Process "https://dashboard.render.com/select-repo?type=blueprint"
Write-Host "Appuie sur ENTREE une fois le deploiement lance..." -ForegroundColor Yellow
Read-Host

# ===========================================
# TERMINE!
# ===========================================
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    DEPLOIEMENT LANCE!                        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Tes URLs seront (dans 5-10 minutes):" -ForegroundColor White
Write-Host ""
Write-Host "   Frontend:  https://ocp-frontend.onrender.com" -ForegroundColor Cyan
Write-Host "   Backend:   https://ocp-backend.onrender.com/api/" -ForegroundColor Cyan
Write-Host "   Admin:     https://ocp-backend.onrender.com/admin/" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "   IDENTIFIANTS DE CONNEXION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Username:  Nizar" -ForegroundColor Green
Write-Host "   Password:  Nizar@OCP2025!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Creer un raccourci sur le bureau avec les URLs
$desktopPath = [Environment]::GetFolderPath("Desktop")

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$desktopPath\OCP App - Frontend.url")
$Shortcut.TargetPath = "https://ocp-frontend.onrender.com"
$Shortcut.Save()

$Shortcut2 = $WshShell.CreateShortcut("$desktopPath\OCP App - Admin.url")
$Shortcut2.TargetPath = "https://ocp-backend.onrender.com/admin/"
$Shortcut2.Save()

Write-Host "[OK] Raccourcis crees sur le bureau!" -ForegroundColor Green
Write-Host ""
Write-Host "Appuie sur ENTREE pour fermer..." -ForegroundColor Gray
Read-Host

