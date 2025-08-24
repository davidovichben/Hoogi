#!/usr/bin/env bash
set -euo pipefail

BRANCH="fix/vite-supabase-chunk"
: "${REPO_URL:=https://github.com/ai-4biz/hoogi-answer-buddy.git}"

git config --global core.autocrlf input
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REPO_URL"
fi

git fetch origin --prune || true

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git pull --rebase origin "$BRANCH" || true
fi

git add -A
git commit -m "chore: sync local changes for $BRANCH" || true
git push -u origin "$BRANCH"
echo "[OK] pushed to origin/$BRANCH"
