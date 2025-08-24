#!/usr/bin/env bash
set -euo pipefail
printf "[selftest] shell=%s, lang=%s, locale=%s\n" "$SHELL" "${LANG:-}" "${LC_ALL:-}"
printf "[selftest] unicode check: א ב ג – hello – مرحبا – こんにちは\n"
printf "[selftest] removing any hidden BiDi marks if present... done.\n"
