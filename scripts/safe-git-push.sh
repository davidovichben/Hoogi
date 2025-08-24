#!/usr/bin/env bash
set -euo pipefail

BRANCH="fix/vite-supabase-chunk"
: "${REPO_URL:=}"   # optional, used only if no 'origin' exists

echo "[info] Git version: $(git --version)"

# Ensure repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[error] Not inside a Git repository. Run 'git init' and add a remote first." >&2
  exit 1
fi

# Global safety (utf-8, line endings)
git config --global core.autocrlf input
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8

# Minimal identity if missing (customize later if needed)
git config user.name  >/dev/null || git config user.name  "AI-4Biz"
git config user.email >/dev/null || git config user.email "no-reply@ai-4biz.local"

# Remote origin
if ! git remote get-url origin >/dev/null 2>&1; then
  if [[ -z "${REPO_URL}" ]]; then
    echo "[error] No 'origin' remote found and REPO_URL not provided."
    echo "        Set REPO_URL='https://github.com/USER/REPO.git' and rerun."
    exit 1
  fi
  echo "[info] Adding origin: $REPO_URL"
  git remote add origin "$REPO_URL"
fi

# Fetch
echo "[info] Fetching from origin..."
git fetch origin --prune

# Checkout or create branch
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "[info] Switching to local branch $BRANCH"
  git checkout "$BRANCH"
else
  echo "[info] Creating local branch $BRANCH"
  git checkout -b "$BRANCH"
fi

# Link to remote branch if not linked
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
  # Upstream might not exist yet; try to set it after first push
  echo "[warn] No upstream set yet for $BRANCH (will set on push)"
fi

# Rebase on remote if remote branch exists
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  echo "[info] Pulling latest (rebase) from origin/$BRANCH"
  git pull --rebase origin "$BRANCH"
fi

# Stage & commit if there are changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[info] Staging changes..."
  git add -A
  MSG="chore: sync local changes for $BRANCH ($(date -u +'%Y-%m-%d %H:%M:%S UTC'))"
  echo "[info] Committing: $MSG"
  git commit -m "$MSG" || true
else
  echo "[info] No local changes to commit."
fi

# Push (create remote & set upstream if needed)
echo "[info] Pushing to origin/$BRANCH"
git push -u origin "$BRANCH"

echo "[ok] Push completed successfully to origin/$BRANCH"
