@echo off
echo ===================================================
echo   Pushing ELMS to GitHub
echo ===================================================
cd /d "%~dp0"

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit /b
)

:: Initialize git repository if not already done
if not exist .git (
    echo [INFO] Initializing Git repository...
    git init
) else (
    echo [INFO] Git repository already initialized.
)

:: Add all files
echo [INFO] Staging files...
git add .

:: Commit files
echo [INFO] Committing files...
git commit -m "Initial commit"

:: Set branch name to main
echo [INFO] Setting branch to main...
git branch -M main

:: Remove existing origin if it exists
git remote remove origin >nul 2>nul

:: Add the remote URL
echo [INFO] Adding remote origin...
git remote add origin https://github.com/Rudra-Narayan-Swain/ELMS.git

:: Push to main branch
echo [INFO] Pushing to GitHub (you may be prompted to log in)...
git push -u origin main

echo ===================================================
echo   Done!
echo ===================================================
pause
