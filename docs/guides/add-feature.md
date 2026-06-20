# Add a feature slice

Dever is organized in feature slices: a feature owns its model, its IPC surface, its UI,
and its tests, end to end. `features/repos` is the reference — when in doubt, copy its
shape on both sides. The conventions referenced below load automatically while you work
in `src-tauri/` and `src-ui/`; this guide is the ordered procedure that ties them
together.

## Backend (`src-tauri/`) — see [backend conventions](../conventions/backend.md)

1. Create `src-tauri/src/features/<feature>/` with:
   - `mod.rs` — re-export the feature's commands.
   - `model.rs` — the serde structs (`#[serde(rename_all = "camelCase")]`).
   - `<domain>.rs` — the actual logic, kept pure where possible, with unit tests.
   - `commands.rs` — thin `#[tauri::command]` fns: validate, call the logic, map errors.
2. Declare the module in `src-tauri/src/features/mod.rs`.
3. Register the commands in `src-tauri/src/lib.rs`: import them from
   `features::<feature>::commands` and add each to the `tauri::generate_handler![…]` list.

## Frontend (`src-ui/`) — see [frontend conventions](../conventions/frontend.md)

4. Create `src-ui/features/<feature>/` with:
   - `types.ts` — the exact TS mirror of `model.rs` (camelCase).
   - `api.ts` — the typed `invoke()` calls. This is the only place `invoke()` is called.
   - `use<Feature>.ts` — the React hook (state, loading, error, actions).
   - `derive.ts` — pure raw-model → view-model logic.
   - `components/` — the feature's UI, wired through the hook.
5. Surface the feature's UI from the dashboard/`App.tsx` as appropriate.

## Contract & tests

6. Keep `model.rs` and `types.ts` in lockstep — they are the
   [IPC contract](../conventions/ipc-contract.md) and change together.
7. Add tests on both sides (Rust unit tests for logic/parsers; Vitest for `derive.ts` and
   `api.ts`/hooks with `invoke` mocked).
8. Run `bun run check` until green before considering the feature done.
