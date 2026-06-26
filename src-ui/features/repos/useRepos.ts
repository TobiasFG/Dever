import { useCallback, useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import {
  addScanRoot,
  listEditors,
  listScanRoots,
  pullRepo,
  removeScanRoot,
  scanRepos,
  setRepoOrder,
} from './api';
import type { Editor, Repo } from './types';

/** Outcome of a bulk pull: how many repos fast-forwarded and how many failed. */
export type PullAllResult = { pulled: number; failed: number };

export function useRepos() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [roots, setRoots] = useState<string[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pull the latest repo + root state. `quiet` skips the loading flag so the
  // periodic background poll doesn't flicker the spinner on every tick.
  const load = useCallback(async (quiet: boolean) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const [scanned, list] = await Promise.all([scanRepos(), listScanRoots()]);
      setRepos(scanned);
      setRoots(list);
    } catch (e) {
      setError(String(e));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load(false), [load]);

  const addRoot = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select a folder to scan for repositories',
    });
    if (typeof selected !== 'string') return;
    setLoading(true);
    setError(null);
    try {
      setRoots(await addScanRoot(selected));
      setRepos(await scanRepos());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const removeRoot = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      setRoots(await removeScanRoot(path));
      setRepos(await scanRepos());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply a new ordering (a list of repo paths) optimistically and persist it.
  const reorder = useCallback((orderedPaths: string[]) => {
    setRepos((prev) => {
      const byPath = new Map(prev.map((r) => [r.path, r]));
      const next = orderedPaths.map((p) => byPath.get(p)).filter((r): r is Repo => r !== undefined);
      return next.length === prev.length ? next : prev;
    });
    void setRepoOrder(orderedPaths).catch((e) => setError(String(e)));
  }, []);

  const pull = useCallback(async (path: string) => {
    const updated = await pullRepo(path);
    setRepos((prev) => prev.map((r) => (r.path === path ? updated : r)));
  }, []);

  // Pull a set of repos sequentially, swallowing per-repo failures (e.g. a
  // pull that isn't a clean fast-forward) and reporting a tally.
  const pullAll = useCallback(
    async (paths: string[]): Promise<PullAllResult> => {
      let pulled = 0;
      let failed = 0;
      for (const path of paths) {
        try {
          await pull(path);
          pulled += 1;
        } catch {
          failed += 1;
        }
      }
      return { pulled, failed };
    },
    [pull],
  );

  useEffect(() => {
    void (async () => {
      await refresh();
      // The installed editor set is machine-global, not per-repo — fetch once.
      setEditors(await listEditors().catch(() => []));
    })();
  }, [refresh]);

  // Re-scan in the background every 5s so external changes (new repos, pulled
  // branches) show up without pressing rescan.
  useEffect(() => {
    const id = setInterval(() => void load(true), 5000);
    return () => clearInterval(id);
  }, [load]);

  return {
    repos,
    roots,
    editors,
    loading,
    error,
    refresh,
    addRoot,
    removeRoot,
    reorder,
    pull,
    pullAll,
  };
}
