# The IPC contract

This is the boundary between Rust and the frontend. It is cross-cutting: it governs both
`src-tauri/` and `src-ui/`, and the two sides must change together.

- Commands return `Result<T, AppError>`. `AppError` is a serializable struct (`message`,
  optional `kind`) — never leak a raw `std::io::Error`/`anyhow` to the frontend.
- Rust models use `#[serde(rename_all = "camelCase")]`; the TS type in the feature's
  `types.ts` must mirror them exactly. These two definitions are the contract — change
  them together, in the same commit.
- `api.ts` is the single chokepoint for `invoke()`. Components and hooks call `api.ts`,
  never `invoke()` directly.
