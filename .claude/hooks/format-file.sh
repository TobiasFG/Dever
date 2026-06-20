#!/usr/bin/env bash
# PostToolUse hook: auto-format the file that was just edited.
# Receives the hook payload as JSON on stdin; formats by extension. Best-effort, never blocks.
set -uo pipefail

file=$(bun -e 'const d = await Bun.stdin.json(); process.stdout.write(d?.tool_input?.file_path ?? "")' 2>/dev/null || true)
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

case "$file" in
  *.ts | *.tsx | *.css | *.json | *.html | *.md)
    bunx prettier --write "$file" >/dev/null 2>&1 || true
    ;;
  *.rs)
    rustfmt --edition 2021 "$file" >/dev/null 2>&1 || true
    ;;
esac
exit 0
