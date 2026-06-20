# Backend conventions (`src-tauri/`)

Rust owns all the work: filesystem, git, process, and network access happen here and are
exposed to the frontend as Tauri commands. The frontend never shells out or touches the
filesystem directly. `features/repos` is the reference implementation — copy its shape.

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
```

A feature's commands are wired into the app in `lib.rs`: import them from
`features::<feature>::commands` and add each to the `tauri::generate_handler![…]` list.

## Git

We shell out to the user's `git` CLI (via `std::process::Command`), never a libgit2
binding — this inherits their git config, credential helpers, and SSH keys. Prefer one
batched command per repo (e.g. `git status --porcelain=v2 --branch`) and parse the
stable porcelain output. Parsing functions must be pure and unit-tested.

## Testing

`cargo test`. Pure parsers/logic get unit tests with fixture inputs; logic touching the
filesystem uses `tempfile`. Keep tests in a `#[cfg(test)] mod tests` block in the same
file.

> The IPC surface (command signatures, error type, serde casing) is governed by
> [`ipc-contract.md`](./ipc-contract.md), which loads alongside this file.
