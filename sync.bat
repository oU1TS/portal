@echo off
setlocal
title oU1TS Portal - Supabase JSON Sync Engine
cd /d "%~dp0"

echo ======================================================================
echo   oU1TS Portal - Supabase ^<--^> JSON Sync Engine
echo ======================================================================
echo.

if "%1"=="" (
    echo [INFO] Running Smart Sync (keeping latest content)...
    echo.
    node scripts\sync-database.js sync
) else (
    echo [INFO] Running in '%1' mode...
    echo.
    node scripts\sync-database.js %*
)

echo.
echo ======================================================================
echo   Process finished.
echo ======================================================================
echo.
pause

