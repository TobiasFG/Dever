import type { DocNode, DocStatus } from './types';

/** Per-repo record of what the user has already seen, keyed by repo path. */
const KEY = (repo: string) => `dever:docs-seen:${repo}`;

/** What we remember about a doc the user has baselined or opened: its mtime.
 * (Mtimes only — no content — so the store stays tiny and bounded.) */
export type SeenEntry = { modified: number };
export type SeenMap = Record<string, SeenEntry>;

export function loadSeen(repo: string): SeenMap | null {
  try {
    const raw = localStorage.getItem(KEY(repo));
    return raw ? (JSON.parse(raw) as SeenMap) : null;
  } catch {
    return null;
  }
}

export function saveSeen(repo: string, map: SeenMap): void {
  try {
    localStorage.setItem(KEY(repo), JSON.stringify(map));
  } catch {
    // Best-effort: change tracking is a nicety, not a correctness requirement.
  }
}

/** Baseline a repo's docs the first time it's opened so nothing is flagged on
 * first view; later additions/edits then stand out against this snapshot. */
export function baselineFrom(nodes: DocNode[]): SeenMap {
  const map: SeenMap = {};
  for (const n of nodes) if (!n.isDir) map[n.path] = { modified: n.modified };
  return map;
}

/** A file is "new" when it appeared after the baseline, "updated" when its
 * mtime is newer than the seen mtime, otherwise unchanged. */
export function statusFor(node: DocNode, seen: SeenMap): DocStatus {
  const entry = seen[node.path];
  if (!entry) return 'new';
  return node.modified > entry.modified ? 'updated' : 'unchanged';
}
