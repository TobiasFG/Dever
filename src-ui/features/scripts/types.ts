/** Mirrors the Rust `ScriptKind` enum in `src-tauri/src/features/scripts/model.rs`. */
export type ScriptKind = 'powerShell' | 'shell' | 'batch' | 'python' | 'node';

/** Mirrors the Rust `ScriptScope` enum in `src-tauri/src/features/scripts/model.rs`. */
export type ScriptScope = 'repo' | 'global';

/** Mirrors the Rust `Script` struct in `src-tauri/src/features/scripts/model.rs`. */
export type Script = {
  path: string;
  name: string;
  relPath: string;
  kind: ScriptKind;
  scope: ScriptScope;
};

/** Mirrors the Rust `ScriptResult` struct in `src-tauri/src/features/scripts/model.rs`. */
export type ScriptResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  success: boolean;
};
