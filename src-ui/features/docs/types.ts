/** Mirrors the Rust `DocNode` struct in `src-tauri/src/features/docs/model.rs`. */
export type DocNode = {
  path: string;
  name: string;
  isDir: boolean;
  depth: number;
  /** File mtime as Unix epoch milliseconds (0 for directories). */
  modified: number;
};

/** Mirrors the Rust `DocFile` struct in `src-tauri/src/features/docs/model.rs`. */
export type DocFile = {
  path: string;
  content: string;
  modified: number;
};

/** Whether a doc changed since the user last opened this repo's docs. */
export type DocStatus = 'unchanged' | 'new' | 'updated';
