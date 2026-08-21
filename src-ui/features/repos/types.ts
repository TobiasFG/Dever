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

/** Mirrors the Rust `Branch` struct in `src-tauri/src/features/repos/model.rs`. */
export type Branch = {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  upstream: string | null;
};

/** Mirrors the Rust `Editor` struct in `src-tauri/src/features/repos/model.rs`. */
export type Editor = {
  id: string;
  name: string;
};

/** Mirrors the Rust `SolutionKind` enum in `src-tauri/src/features/repos/model.rs`. */
export type SolutionKind = 'solution' | 'project';

/** Mirrors the Rust `Solution` struct in `src-tauri/src/features/repos/model.rs`. */
export type Solution = {
  path: string;
  name: string;
  relPath: string;
  kind: SolutionKind;
};
