@echo off
setlocal
set "GIT_BASH=C:\Program Files\Git\bin\bash.exe"
if not exist "%GIT_BASH%" set "GIT_BASH=C:\Program Files\Git\git-bash.exe"
if not exist "%GIT_BASH%" (
  echo [ERROR] Git for Windows not found. Install from https://git-scm.com/download/win
  pause & exit /b 1
)
pushd "%~dp0\.."
if not exist "logs" mkdir logs
"%GIT_BASH%" -lc "chmod +x scripts/push-now.sh || true; bash scripts/push-now.sh" 1>logs\push.log 2>&1
set ERR=%ERRORLEVEL%
type logs\push.log | tail -n 50
popd
echo.
if %ERR% NEQ 0 (echo [FAIL] push failed. See logs\push.log & pause & exit /b %ERR%)
echo [OK] Push completed.
pause
