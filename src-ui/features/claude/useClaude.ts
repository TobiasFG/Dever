import { useCallback, useEffect, useState } from 'react';
import { claudeStatus, setMcpEnabled, setPluginEnabled, writeGlobalClaudeMd } from './api';
import type { ClaudeStatus } from './types';

export function useClaude() {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await claudeStatus());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

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

  return { status, loading, error, refresh, toggleMcp, togglePlugin, saveSystemPrompt };
}
