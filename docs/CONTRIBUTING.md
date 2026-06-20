# Contributing to Dever

## Where things are

- **Codebase structure, principles, and conventions:** [ARCHITECTURE.md](ARCHITECTURE.md).
- **Adding a feature:** [guides/add-feature.md](guides/add-feature.md).
- **Changing the documentation itself** (conventions, guides, or the AI-agent adapters):
  [guides/maintaining-docs.md](guides/maintaining-docs.md).

## Workflow

- Work directly on the `main` branch.
- When a feature is approved as done, stage, commit, and merge it.

## The gate

Every change must pass the gate before it's done:

```bash
bun run check
```

It runs format + lint + typecheck + tests across both the frontend and Rust, and Claude
Code's Stop hook runs it automatically at the end of each turn. Don't work around it — fix
the cause.
