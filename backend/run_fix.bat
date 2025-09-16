@echo off
echo ========================================
echo   Novel Reader Admin Panel Fix
echo ========================================
echo.

cd /d "d:\webtruyen\pntruyen2\backend"

echo Running bindParam fix script...
echo.

php fix_bindparam.php

echo.
echo ========================================
echo Fix completed! Press any key to exit...
pause > nul
