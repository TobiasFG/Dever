/** Mirrors the Rust `Repo` struct in `src-tauri/src/features/repos/model.rs`. */
export type Repo = {
  name: string;
  path: string;
  branch: string | null;
  upstream: string | null;
  ahead: number;
  behind: number;
  changes: number;
  conflict: boolean;
  detached: boolean;
};
