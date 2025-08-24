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

REM ---- Repo root = folder where this .bat lives, up one level if needed ----
pushd "%~dp0\.."

echo [INFO] Checking repo...
"%GIT_BASH%" -lc "git rev-parse --is-inside-work-tree >/dev/null || (echo '[ERROR] Not a git repo.' && exit 1); \
  echo '--- status -sb ---'; git status -sb; \
  echo '--- remote -v ---'; git remote -v; \
  echo '--- branch ---'; git rev-parse --abbrev-ref HEAD; \
  echo '--- last commit ---'; git --no-pager log -1 --oneline"
set ERR=%ERRORLEVEL%
popd
echo.
if %ERR% NEQ 0 (echo [FAIL] status failed & pause & exit /b %ERR%)
echo [OK] status looks fine.
pause
