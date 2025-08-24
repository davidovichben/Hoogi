# 1. ודא שאת בתוך פרויקט git, ואם לא – אתחל
if [ ! -d .git ]; then
  git init
fi

# 2. הגדרות כלליות (UTF-8 ו־safe commits)
git config --global core.autocrlf input
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8

# זהות בסיסית (אם חסרה)
git config user.name  "AI-4Biz"
git config user.email "no-reply@ai-4biz.local"

# 3. ודא שיש remote בשם origin
if ! git remote get-url origin >/dev/null 2>&1; then
  # החליפי את ה־URL בקישור שלך ל־GitHub
  git remote add origin https://github.com/ai-4biz/hoogi-answer-buddy.git
fi

# 4. עדכון מהשרת (אם יש)
git fetch origin --prune || true

# 5. מעבר לענף היעד
if git show-ref --verify --quiet refs/heads/fix/vite-supabase-chunk; then
  git checkout fix/vite-supabase-chunk
else
  git checkout -b fix/vite-supabase-chunk
fi

# 6. משיכה עם rebase (אם הענף קיים ב־remote)
if git ls-remote --exit-code --heads origin fix/vite-supabase-chunk >/dev/null 2>&1; then
  git pull --rebase origin fix/vite-supabase-chunk || true
fi

# 7. הוספת שינויים וקומיט
git add -A
git commit -m "chore: sync local changes for fix/vite-supabase-chunk" || true

# 8. דחיפה ל־GitHub
git push -u origin fix/vite-supabase-chunk
