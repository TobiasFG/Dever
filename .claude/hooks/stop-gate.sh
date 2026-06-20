#!/usr/bin/env bash
# Stop hook: the enforcement gate. Runs the full `bun run check` suite when the agent
# finishes. Non-zero exit (2) blocks completion and feeds the failure back to the agent.
set -uo pipefail

# Avoid an infinite loop: if we're already continuing from a previous stop-gate, let it pass.
active=$(bun -e 'const d = await Bun.stdin.json(); process.stdout.write(String(d?.stop_hook_active ?? false))' 2>/dev/null || echo false)
[ "$active" = "true" ] && exit 0

out=$(bun run check 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "Enforcement gate failed — 'bun run check' must pass before finishing. Fix the cause (do not bypass):"
    echo "$out"
  } >&2
  exit 2
fi
exit 0
