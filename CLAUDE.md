# Intro
Dever is a cross platform desktop application (macOS, Linux, Windows) designed to help developers with everyday tasks, provide overviews, and automate tedious tasks.

## Stack
Dever is built using:

Tauri v2 (Rust backend + system webview): https://v2.tauri.app/
React 19 + Vite + TypeScript for the frontend UI.
Plain CSS for styling — the design palette lives as CSS variables in `src-ui/styles.css` (Atlassian dark theme tokens).
Bun as the node package manager.

## Layout
- `src-ui/` — React frontend (`App.tsx`, `features/`, `components/`, `lib/`, `theme/`, `styles.css`).
- `src-tauri/` — Rust backend, Tauri config, native commands.

## Conventions — READ BEFORE WRITING CODE
All structure and standards live in **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**. In short:
- Code is organized in **feature slices** (`features/<feature>/`), not by technical layer. `features/repos` is the reference implementation — copy its shape.
- All filesystem/git/process/network work lives in **Rust**, exposed as Tauri commands. The frontend never shells out or touches the FS directly.
- Commands return `Result<T, AppError>`; Rust models use `#[serde(rename_all = "camelCase")]` and have an exact TS mirror in the feature's `types.ts`. `api.ts` is the only place `invoke()` is called.
- Git access shells out to the user's `git` CLI (never libgit2).
- Every change must pass **`bun run check`** (format + lint + typecheck + tests, both stacks). Hooks run it automatically at the end of each turn — don't work around it, fix the cause.

## Running
- `bun run desktop` — launch the native desktop app (Tauri dev).
- `bun run dev` — frontend only, in a browser at http://localhost:1420.
- `bun run desktop:build` — produce a distributable native bundle.

## Checks
- `bun run check` — full gate (run before considering work done).
- `bun run test` / `bun run typecheck` / `bun run lint` / `bun run format` — individual frontend checks.
- `bun run check:rust` — `cargo fmt --check` + `clippy` + `cargo test`.
