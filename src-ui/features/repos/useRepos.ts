import { useCallback, useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { addScanRoot, listEditors, listScanRoots, scanRepos } from './api';
import type { Editor, Repo } from './types';

export function useRepos() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [roots, setRoots] = useState<string[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scanned, list] = await Promise.all([scanRepos(), listScanRoots()]);
      setRepos(scanned);
      setRoots(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    void (async () => {
      await refresh();
      // The installed editor set is machine-global, not per-repo — fetch once.
      setEditors(await listEditors().catch(() => []));
    })();
  }, [refresh]);

  return { repos, roots, editors, loading, error, refresh, addRoot };
}
