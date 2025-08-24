@echo off
echo [INFO] Pushing to GitHub...
echo [INFO] Repository: ai-4biz/hoogi-answer-buddy
echo [INFO] Branch: fix/vite-supabase-chunk
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

REM Add all changes
echo [INFO] Adding all changes...
git add -A

REM Commit changes
echo [INFO] Committing changes...
git commit -m "chore: sync changes for fix/vite-supabase-chunk" || echo [WARN] No changes to commit

REM Push to GitHub
echo [INFO] Pushing to GitHub...
git push -u origin fix/vite-supabase-chunk

if errorlevel 1 (
    echo [ERROR] Push failed!
    echo [INFO] Check your GitHub credentials and repository access.
) else (
    echo [SUCCESS] Push completed successfully!
)

echo.
pause
