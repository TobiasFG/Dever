import { useCallback, useEffect, useState } from 'react';
import { listBranches, switchBranch } from './api';
import type { Branch } from './types';

/** Loads a repo's branches for the detail screen and exposes a switch action
 * that refreshes the list afterward. */
export function useBranches(repoPath: string) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBranches(await listBranches(repoPath));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [repoPath]);

  const switchTo = useCallback(
    async (name: string, isRemote: boolean) => {
      setSwitching(name);
      setError(null);
      try {
        await switchBranch(repoPath, name, isRemote);
        await refresh();
      } catch (e) {
        setError(String(e));
      } finally {
        setSwitching(null);
      }
    },
    [repoPath, refresh],
  );

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  return { branches, loading, error, switching, switchTo, refresh };
}
