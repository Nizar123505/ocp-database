@echo off
chcp 65001 >nul
title Deploiement OCP sur Render
color 0A

echo ╔══════════════════════════════════════════════════════════════╗
echo ║     DEPLOIEMENT AUTOMATIQUE - Application OCP sur Render     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Vérifier si Git est installé
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git n'est pas installe. Installation en cours...
    echo.
    echo Telechargement de Git...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe' -OutFile 'git-installer.exe'"
    echo Installation de Git...
    start /wait git-installer.exe /VERYSILENT /NORESTART
    del git-installer.exe
    echo [OK] Git installe avec succes!
    echo.
    echo Veuillez REDEMARRER ce script apres l'installation.
    pause
    exit
)

echo [OK] Git est installe
echo.

cd /d "%~dp0"

echo ══════════════════════════════════════════════════════════════
echo  Etape 1: Initialisation du repository Git
echo ══════════════════════════════════════════════════════════════
git init
git add .
git commit -m "Initial commit - Application OCP Port Jorf Lasfar"
echo.

echo ══════════════════════════════════════════════════════════════
echo  Etape 2: Configuration GitHub
echo ══════════════════════════════════════════════════════════════
echo.
set /p GITHUB_USER="Entrez votre nom d'utilisateur GitHub: "
set /p REPO_NAME="Entrez le nom du repository (ex: ocp-app): "
echo.

echo Creation du repository sur GitHub...
echo.
echo [!] IMPORTANT: Vous devez creer le repository manuellement sur GitHub:
echo.
echo     1. Allez sur https://github.com/new
echo     2. Nom du repository: %REPO_NAME%
echo     3. Laissez-le PUBLIC
echo     4. NE PAS initialiser avec README
echo     5. Cliquez sur "Create repository"
echo.
start https://github.com/new
echo.
pause

echo.
echo Connexion au repository distant...
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
git branch -M main
git push -u origin main

echo.
echo [OK] Code pousse sur GitHub!
echo.

echo ══════════════════════════════════════════════════════════════
echo  Etape 3: Deploiement sur Render
echo ══════════════════════════════════════════════════════════════
echo.
echo [!] IMPORTANT: Suivez ces etapes sur Render:
echo.
echo     1. Allez sur https://dashboard.render.com
echo     2. Cliquez sur "New" puis "Blueprint"  
echo     3. Connectez votre compte GitHub
echo     4. Selectionnez le repository: %REPO_NAME%
echo     5. Cliquez sur "Apply"
echo     6. Attendez 5-10 minutes pour le deploiement
echo.
start https://dashboard.render.com
echo.
pause

echo.
echo ══════════════════════════════════════════════════════════════
echo  DEPLOIEMENT TERMINE!
echo ══════════════════════════════════════════════════════════════
echo.
echo Vos URLs seront:
echo.
echo   Frontend:  https://ocp-frontend.onrender.com
echo   Backend:   https://ocp-backend.onrender.com/api/
echo   Admin:     https://ocp-backend.onrender.com/admin/
echo.
echo Superuser: Nizar / nizar
echo.
echo ══════════════════════════════════════════════════════════════
pause

