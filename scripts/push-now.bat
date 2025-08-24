@echo off
REM ----------------------------------------------
REM Hoogi: one-click Git push for Windows (.bat)
REM Usage: double-click or run: scripts\push-now.bat [branch]
REM If no branch passed, uses current checked-out branch.
REM ----------------------------------------------

setlocal ENABLEDELAYEDEXPANSION

REM Ensure we're at repo root (this file is under scripts\)
cd /d "%~dp0.."

REM Detect current branch if not provided
for /f "tokens=2" %%b in ('git status -b --porcelain ^| findstr /B "##"') do set CURBR=%%b
for /f "tokens=1 delims=." %%c in ("!CURBR!") do set CURBR=%%c

if "%~1"=="" (
  set BRANCH=!CURBR!
) else (
  set BRANCH=%~1
)

echo.
echo === Hoogi push (branch: !BRANCH!) ===

REM Safety: stop if no git repo
git rev-parse --is-inside-work-tree >NUL 2>&1
if errorlevel 1 (
  echo Not a git repository. Aborting.
  exit /b 1
)

REM Add all, commit (skip if no changes), pull --rebase, then push
git add -A

REM Commit only if there are staged changes
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "chore: savepoint – %DATE% %TIME%"
) else (
  echo No staged changes to commit.
)

REM Make sure remote exists
git remote get-url origin >NUL 2>&1
if errorlevel 1 (
  echo No remote 'origin' configured. Please set it once:
  echo   git remote add origin https://github.com/ai-4biz/hoogi-answer-buddy.git
  exit /b 1
)

REM Ensure branch exists remote tracking
git rev-parse --abbrev-ref --symbolic-full-name @{u} >NUL 2>&1
if errorlevel 1 (
  echo Setting upstream to origin/!BRANCH!
  git push -u origin !BRANCH!
  goto :end
)

echo Pulling latest (rebase)...
git pull --rebase origin !BRANCH!
if errorlevel 1 (
  echo Pull failed (conflicts?). Resolve then re-run this script.
  exit /b 1
)

echo Pushing...
git push origin !BRANCH!
if errorlevel 1 (
  echo Push failed. If auth popup appears, login and re-run.
  exit /b 1
)

:end
echo === Done. ===
exit /b 0
