@echo off
echo ========================================
echo Employee Leave Management System
echo Quick Start Script
echo ========================================
echo.

echo Step 1: Checking MySQL connection...
echo Please ensure MySQL is running!
echo.

echo Step 2: Setting up database...
echo Run this command in MySQL:
echo    SOURCE %~dp0database/database.sql
echo.

echo Step 3: Starting backend server...
cd %~dp0backend
start "ELMS Backend" cmd /k "npm start"
echo Backend server starting on http://localhost:3000
echo.

echo Step 4: Opening frontend...
timeout /t 3 > nul
start "" "%~dp0frontend\index.html"
echo.

echo ========================================
echo System is ready!
echo ========================================
echo.
echo Login credentials:
echo Manager: admin@company.com / password (after running FIX_LOGIN.sql) or password123
echo Employee: alice.smith@company.com / password123
echo.
echo Press any key to exit...
pause > nul
