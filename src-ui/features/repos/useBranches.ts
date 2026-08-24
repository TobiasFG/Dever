import { useCallback, useEffect, useState } from 'react';
import { deleteLocalBranch, deleteRemoteBranch, listBranches, switchBranch } from './api';
import type { BranchGroup } from './branchGroups';
import type { Branch } from './types';

/** Loads a repo's branches for the detail screen and exposes switch and delete
 * actions that refresh the list afterward. */
export function useBranches(repoPath: string) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  /** Delete a branch locally, on its remotes, or both. `force` maps to
   * `git branch -D`, needed when the local branch isn't merged. */
  const remove = useCallback(
    async (
      group: BranchGroup,
      opts: { local: boolean; remote: boolean; force: boolean },
    ): Promise<boolean> => {
      setDeleting(group.name);
      setError(null);
      try {
        if (opts.remote) {
          for (const r of group.remotes) await deleteRemoteBranch(repoPath, r.name);
        }
        if (opts.local && group.local) {
          await deleteLocalBranch(repoPath, group.local.name, opts.force);
        }
        await refresh();
        return true;
      } catch (e) {
        setError(String(e));
        return false;
      } finally {
        setDeleting(null);
      }
    },
    [repoPath, refresh],
  );

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  return { branches, loading, error, switching, switchTo, deleting, remove, refresh };
}
