import { useCallback, useEffect, useState } from 'react';
import { claudeStatus, setMcpEnabled, setPluginEnabled, writeGlobalClaudeMd } from './api';
import type { ClaudeStatus } from './types';

export function useClaude() {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read the latest Claude settings. `quiet` skips the loading flag so the
  // periodic background poll doesn't flicker the spinner on every tick.
  const load = useCallback(async (quiet: boolean) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      setStatus(await claudeStatus());
    } catch (e) {
      setError(String(e));
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load(false), [load]);

  const toggleMcp = useCallback(
    async (name: string, enabled: boolean) => {
      await setMcpEnabled(name, enabled);
      await refresh();
    },
    [refresh],
  );

  const togglePlugin = useCallback(
    async (key: string, enabled: boolean) => {
      await setPluginEnabled(key, enabled);
      await refresh();
    },
    [refresh],
  );

  const saveSystemPrompt = useCallback(
    async (content: string) => {
      await writeGlobalClaudeMd(content);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  // Re-read settings in the background every 5s so external edits (toggled MCP
  // servers, changed plugins) show up without pressing rescan.
  useEffect(() => {
    const id = setInterval(() => void load(true), 5000);
    return () => clearInterval(id);
  }, [load]);

  return { status, loading, error, refresh, toggleMcp, togglePlugin, saveSystemPrompt };
}
