@echo off
setlocal
REM ---- Find Git Bash ----
set "GIT_BASH=C:\Program Files\Git\bin\bash.exe"
if not exist "%GIT_BASH%" set "GIT_BASH=C:\Program Files\Git\git-bash.exe"
if not exist "%GIT_BASH%" (
  echo [ERROR] Git for Windows not found. Install from https://git-scm.com/download/win
  pause
  exit /b 1
)

REM ---- Repo root ----
pushd "%~dp0\.."

REM ---- Ensure scripts/safe-push.sh exists ----
if not exist "scripts\safe-push.sh" (
  echo [INFO] creating scripts/safe-push.sh ...
  >scripts\safe-push.sh echo #!/usr/bin/env bash
  >>scripts\safe-push.sh echo set -euo pipefail
  >>scripts\safe-push.sh echo BRANCH="fix/vite-supabase-chunk"
  >>scripts\safe-push.sh echo ': "${REPO_URL:=https://github.com/ai-4biz/hoogi-answer-buddy.git}"'
  >>scripts\safe-push.sh echo git config --global core.autocrlf input
  >>scripts\safe-push.sh echo git config --global i18n.commitEncoding utf-8
  >>scripts\safe-push.sh echo git config --global i18n.logOutputEncoding utf-8
  >>scripts\safe-push.sh echo 'git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init'
  >>scripts\safe-push.sh echo 'git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REPO_URL"'
  >>scripts\safe-push.sh echo git fetch origin --prune ^|^| true
  >>scripts\safe-push.sh echo 'git show-ref --verify --quiet "refs/heads/$BRANCH" ^&^& git checkout "$BRANCH" ^|^| git checkout -b "$BRANCH"'
  >>scripts\safe-push.sh echo 'git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1 ^&^& git pull --rebase origin "$BRANCH" ^|^| true'
  >>scripts\safe-push.sh echo git add -A
  >>scripts\safe-push.sh echo 'git commit -m "chore: sync local changes for $BRANCH" ^|^| true'
  >>scripts\safe-push.sh echo 'git push -u origin "$BRANCH"'
  >>scripts\safe-push.sh echo 'echo "[OK] pushed to origin/$BRANCH"'
)

REM ---- Log folder ----
if not exist "logs" mkdir logs

echo [INFO] pushing... (full log: logs\push.log)
"%GIT_BASH%" -lc "chmod +x scripts/safe-push.sh || true; bash scripts/safe-push.sh" ^
  1>logs\push.log 2>&1

set ERR=%ERRORLEVEL%
type logs\push.log | tail -n 50
popd
echo.
if %ERR% NEQ 0 (echo [FAIL] push failed. See logs\push.log & pause & exit /b %ERR%)
echo [OK] push finished successfully.
pause
