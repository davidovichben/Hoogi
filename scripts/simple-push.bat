@echo off
echo === Simple Git Push ===
cd /d "%~dp0.."
git add -A
git commit -m "chore: remove start button from dashboard"
git push origin fix/vite-supabase-chunk
echo === Done ===
pause
