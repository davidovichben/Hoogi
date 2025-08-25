#!/usr/bin/env bash
# === Hoogi – Push Stable ===
# Add all, commit if needed, pull --rebase, then push

git rev-parse --is-inside-work-tree || exit 1

git add -A

if ! git diff --cached --quiet; then
  git commit -m "chore: savepoint – $(date +'%Y-%m-%d %H:%M:%S')"
else
  echo "No staged changes to commit."
fi

git pull --rebase origin $(git rev-parse --abbrev-ref HEAD)

git push origin $(git rev-parse --abbrev-ref HEAD)
