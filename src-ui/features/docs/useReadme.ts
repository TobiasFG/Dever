import { useEffect, useState } from 'react';
import { readReadme } from './api';
import type { DocFile } from './types';

/** Loads a repo's top-level readme, if it has one. */
export function useReadme(repoPath: string) {
  const [readme, setReadme] = useState<DocFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setReadme(null);
      try {
        const file = await readReadme(repoPath);
        if (!cancelled) setReadme(file);
      } catch {
        if (!cancelled) setReadme(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [repoPath]);

  return { readme, loading };
}
