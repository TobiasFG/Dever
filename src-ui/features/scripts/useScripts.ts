import { useCallback, useEffect, useState } from 'react';
import { useNotifications } from '@/features/notifications/store';
import { listGlobalScripts, listRepoScripts, runScript } from './api';
import { scriptDir } from './derive';
import type { Script, ScriptResult } from './types';

export type ScriptRun = { script: Script; result: ScriptResult };

/**
 * Loads and runs the scripts for one source: a repository's conventional script
 * folders when `repoPath` is set, or the configured global folder when it's
 * `null`. Running a script captures its output, surfaces a completion toast, and
 * exposes the last result for a modal. Mirrors the load/error shape of
 * `useRepos`.
 */
export function useScripts(repoPath: string | null) {
  const { notify } = useNotifications();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [result, setResult] = useState<ScriptRun | null>(null);

  const load = useCallback(
    async (quiet: boolean) => {
      if (!quiet) setLoading(true);
      setError(null);
      try {
        setScripts(repoPath ? await listRepoScripts(repoPath) : await listGlobalScripts());
      } catch (e) {
        setError(String(e));
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [repoPath],
  );

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const run = useCallback(
    async (script: Script) => {
      setRunning(script.path);
      try {
        const res = await runScript(script.path, repoPath ?? scriptDir(script.path));
        const record: ScriptRun = { script, result: res };
        setResult(record);
        notify({
          kind: res.success ? 'success' : 'error',
          title: res.success ? `${script.name} finished` : `${script.name} failed`,
          body: res.success ? undefined : `Exited with code ${res.exitCode ?? '—'}`,
          actionLabel: 'View output',
          onAction: () => setResult(record),
        });
      } catch (e) {
        const message = String(e);
        setError(message);
        notify({ kind: 'error', title: `Couldn't run ${script.name}`, body: message });
      } finally {
        setRunning(null);
      }
    },
    [repoPath, notify],
  );

  return {
    scripts,
    loading,
    error,
    running,
    result,
    run,
    refresh,
    clearResult: () => setResult(null),
  };
}
