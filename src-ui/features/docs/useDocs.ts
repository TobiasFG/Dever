import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listDocs, readDoc } from './api';
import { baselineFrom, loadSeen, saveSeen, statusFor, type SeenMap } from './seen';
import type { DocFile, DocNode, DocStatus } from './types';

/** Pick the doc to show first: a root README, else a top-level ARCHITECTURE,
 * else the first file in the tree. */
function defaultDoc(nodes: DocNode[]): string | null {
  const files = nodes.filter((n) => !n.isDir);
  return (
    files.find((f) => f.path.toLowerCase() === 'readme.md')?.path ??
    files.find((f) => /architecture\.md$/i.test(f.path))?.path ??
    files[0]?.path ??
    null
  );
}

/** Loads a repo's documentation tree and the selected file's contents, and
 * tracks which files have changed since the user last opened this repo. */
export function useDocs(repoPath: string) {
  const [tree, setTree] = useState<DocNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<SeenMap>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocFile | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  // Change status of the open doc, snapshotted at open time so the banner
  // survives marking the file seen in the same render.
  const [docStatus, setDocStatus] = useState<DocStatus>('unchanged');
  // Latest seen baseline, read inside the load effect without making it a
  // dependency (which would refetch on every mark-seen).
  const seenRef = useRef(seen);
  useEffect(() => {
    seenRef.current = seen;
  }, [seen]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setDoc(null);
      setSelected(null);
      try {
        const nodes = await listDocs(repoPath);
        if (cancelled) return;
        // Baseline on first open so the first view flags nothing.
        const stored = loadSeen(repoPath);
        const map = stored ?? baselineFrom(nodes);
        if (!stored) saveSeen(repoPath, map);
        setSeen(map);
        setTree(nodes);
        setSelected(defaultDoc(nodes));
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repoPath]);

  // Load the selected file and mark it seen at its current mtime.
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    void (async () => {
      setDocLoading(true);
      try {
        const f = await readDoc(repoPath, selected);
        if (cancelled) return;
        setDoc(f);
        // Snapshot the change status against the baseline before marking the
        // file seen in the same render (which would otherwise clear it).
        const status = statusFor(
          { path: selected, name: '', isDir: false, depth: 0, modified: f.modified },
          seenRef.current,
        );
        setDocStatus(status);
        setSeen((prevMap) => {
          const next = { ...prevMap, [selected]: { modified: f.modified } };
          saveSeen(repoPath, next);
          return next;
        });
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setDocLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repoPath, selected]);

  const statusOf = useCallback((node: DocNode): DocStatus => statusFor(node, seen), [seen]);

  const markAllRead = useCallback(() => {
    setSeen((prev) => {
      const next = { ...prev };
      for (const n of tree) if (!n.isDir) next[n.path] = { modified: n.modified };
      saveSeen(repoPath, next);
      return next;
    });
  }, [repoPath, tree]);

  const changedCount = useMemo(
    () => tree.filter((n) => !n.isDir && statusFor(n, seen) !== 'unchanged').length,
    [tree, seen],
  );

  // Up to five most-recently-modified files, newest first.
  const recent = useMemo(
    () =>
      tree
        .filter((n) => !n.isDir)
        .slice()
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 5),
    [tree],
  );

  const fileCount = useMemo(() => tree.filter((n) => !n.isDir).length, [tree]);

  return {
    tree,
    loading,
    error,
    selected,
    doc,
    docLoading,
    docStatus,
    selectDoc: setSelected,
    statusOf,
    markAllRead,
    changedCount,
    recent,
    fileCount,
  };
}
