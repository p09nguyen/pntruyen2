@echo off
echo ========================================
echo   DEPLOY BACKEND TO XAMPP
echo ========================================

set SOURCE_DIR=d:\webtruyen\pntruyen2\backend
set TARGET_DIR=D:\xampp\htdocs\pntruyen2

echo.
echo Copying backend files...
echo From: %SOURCE_DIR%
echo To: %TARGET_DIR%

if not exist "%TARGET_DIR%" (
    echo Creating target directory...
    mkdir "%TARGET_DIR%"
)

echo.
echo Copying files...
xcopy "%SOURCE_DIR%\*" "%TARGET_DIR%\" /E /Y /I

echo.
echo ========================================
echo   BACKEND DEPLOYMENT COMPLETED!
echo ========================================
echo.
echo Next steps:
echo 1. Open phpMyAdmin: http://localhost/phpmyadmin
echo 2. Run migration: add_slugs_migration_fixed.sql
echo 3. Test API: http://localhost/pntruyen2/api/stories.php
echo.
pause
