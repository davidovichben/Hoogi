@echo off
REM --- Path to Git Bash (adjust if installed elsewhere) ---
set "GIT_BASH=C:\Program Files\Git\bin\bash.exe"

if not exist "%GIT_BASH%" (
  set "GIT_BASH=C:\Program Files\Git\git-bash.exe"
)

if not exist "%GIT_BASH%" (
  echo [ERROR] Git Bash not found. Please install Git for Windows.
  exit /b 1
)

REM Pass everything after the script name to bash as a single command
"%GIT_BASH%" -lc "%*"
