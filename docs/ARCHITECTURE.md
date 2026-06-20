# Architecture & Conventions

This is the map of how Dever is built — an index into the conventions docs, which are the
single source of truth. The per-tree conventions load automatically for agents working in
that tree; this page is the starting point for the architecture as a whole.

## Principles

- **Feature slices, not layers.** A feature owns its model, IPC surface, UI, and tests.
  `features/repos` is the reference implementation — copy its shape.
- **The backend owns the work; the frontend owns presentation.** All filesystem, git,
  process, and network work happens in Rust and is exposed as Tauri commands; the frontend
  never shells out or touches the filesystem directly.
- **No abstraction until the second caller exists.** Three similar lines beat a premature
  trait/hook — no speculative config, options, or error variants.

## Conventions

- [Backend (`src-tauri/`)](conventions/backend.md) — Rust layout, command rules, git CLI, tests.
- [Frontend (`src-ui/`)](conventions/frontend.md) — React layout, feature shape, styling, tests.
- [The IPC contract](conventions/ipc-contract.md) — the Rust ⇄ frontend boundary (both sides).

## Guides

- [Add a feature slice](guides/add-feature.md) — the end-to-end procedure.
- [Maintaining the docs](guides/maintaining-docs.md) — how to add, edit, or extend documentation.

## How docs reach agents

Documentation has a single home (`/docs`) and is surfaced to AI agents through thin
adapters that point back to it — never by duplicating content: path-scoped conventions are
`@import`ed by nested `CLAUDE.md` files (so they load automatically in that tree), and
procedures are exposed as skills that tell the agent which guide to read.

The full procedure for adding, editing, or extending any of this — and the rules it
follows — lives in [Maintaining the docs](guides/maintaining-docs.md).
