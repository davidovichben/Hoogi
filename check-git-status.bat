@echo off
echo [INFO] Checking Git status...
echo.

REM Check if Git is available
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not found. Please install Git for Windows.
    pause
    exit /b 1
)

REM Check if we're in a Git repository
if not exist .git (
    echo [ERROR] Not in a Git repository.
    pause
    exit /b 1
)

REM Show Git status
echo [INFO] Git Status:
git status

echo.
echo [INFO] Remote repositories:
git remote -v

echo.
echo [INFO] Current branch:
git branch --show-current

echo.
pause
