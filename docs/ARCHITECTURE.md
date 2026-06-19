# Architecture & Conventions

This is the backbone every feature follows. Read it before adding code; agents and
reviewers enforce it. The repo-scanning feature (`features/repos`) is the reference
implementation — copy its shape.

## Principles

- **Feature slices, not layers.** Code is grouped by feature, not by technical role. A
  feature owns its model, its IPC surface, its UI, and its tests.
- **The backend owns the work; the frontend owns presentation.** All filesystem, git,
  process, and network work happens in Rust and is exposed as Tauri commands. The
  frontend never shells out or touches the filesystem directly.
- **No abstraction until the second caller exists.** Three similar lines beat a
  premature trait/hook. Don't add speculative config, options, or error variants.

## Layout

```
src-tauri/src/
  main.rs              entry point → dever_lib::run()
  lib.rs               Tauri builder: registers plugins + every feature's commands
  error.rs             AppError — the serializable error type all commands return
  config.rs            read/write JSON settings under the app config dir
  features/
    mod.rs             declares feature modules
    <feature>/
      mod.rs           re-exports the feature's commands
      commands.rs      #[tauri::command] fns — THIN. Validate, call, map errors. No logic.
      model.rs         serde structs, #[serde(rename_all = "camelCase")]
      <domain>.rs      the actual logic (e.g. git.rs, scan.rs) — pure where possible

src-ui/
  main.tsx, App.tsx, styles.css
  lib/                 cross-feature helpers (e.g. ipc.ts — typed invoke wrapper)
  components/          shared/presentational components (Icon, dashboard shell)
  theme/               design tokens
  features/
    <feature>/
      types.ts         TS mirror of the Rust model (camelCase — matches serde)
      api.ts           invoke() calls, typed returns. The only place invoke() is called.
      use<Feature>.ts  React hook: state, loading, error, actions
      derive.ts        pure presentation logic (raw model → view model)
      components/       feature-specific components
```

## The IPC contract

- Commands return `Result<T, AppError>`. `AppError` is a serializable struct (`message`,
  optional `kind`) — never leak raw `std::io::Error`/`anyhow` to the frontend.
- Rust models use `#[serde(rename_all = "camelCase")]`; the TS type in `types.ts` must
  mirror them exactly. These two definitions are the contract — change them together.
- `api.ts` is the single chokepoint for `invoke()`. Components and hooks call `api.ts`,
  never `invoke()` directly.

## Git

We shell out to the user's `git` CLI (via `std::process::Command`), never a libgit2
binding — this inherits their git config, credential helpers, and SSH keys. Prefer one
batched command per repo (e.g. `git status --porcelain=v2 --branch`) and parse the
stable porcelain output. Parsing functions must be pure and unit-tested.

## Testing

- **Rust**: `cargo test`. Pure parsers/logic get unit tests with fixture inputs; logic
  touching the filesystem uses `tempfile`. Keep tests in a `#[cfg(test)] mod tests` block
  in the same file.
- **Frontend**: Vitest + Testing Library. Test pure functions (`derive.ts`) directly and
  hooks/`api.ts` with `invoke` mocked. Test files sit next to the code as `*.test.ts(x)`.

## The enforcement gate

`bun run check` runs format + lint + typecheck + frontend tests + `cargo fmt`/`clippy`/
`cargo test`. It must pass before any change is considered done. Claude Code hooks run it
automatically at the end of every turn (see `.claude/settings.json`), and a PostToolUse
hook auto-formats edited files. Don't disable or work around the gate — fix the cause.
