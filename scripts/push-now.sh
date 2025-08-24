#!/usr/bin/env bash
set -euo pipefail

BRANCH="fix/vite-supabase-chunk"
REPO_URL="https://github.com/ai-4biz/hoogi-answer-buddy.git"

# Global safety + identity
git config --global core.autocrlf input
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
git config user.name  >/dev/null 2>&1 || git config user.name  "AI-4Biz"
git config user.email >/dev/null 2>&1 || git config user.email "no-reply@ai-4biz.local"

# Ensure repo + remote
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REPO_URL"

# Make sure we are on the fixed branch
git fetch origin --prune || true
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

# Rebase on remote if remote branch exists
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git pull --rebase origin "$BRANCH" || true
fi

# Stage + commit if needed
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "chore: sync local changes for $BRANCH ($(date -u +'%Y-%m-%d %H:%M:%S UTC'))" || true
fi

# Push (sets upstream on first time)
git push -u origin "$BRANCH"

echo "[OK] pushed to origin/$BRANCH"
