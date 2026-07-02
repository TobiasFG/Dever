import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNotifications } from '@/features/notifications/store';
import type { Repo } from '@/features/repos/types';
import { askClaude } from './api';
import { AnswerModal } from './components/AnswerModal';
import type { ClaudeAnswer } from './types';

export type AskStatus = 'pending' | 'ready' | 'error';

/** One question asked of Claude about a repo and its eventual outcome. Kept at
 * app level so an answer stays viewable after the user navigates away. */
export type AskRecord = {
  id: string;
  repoPath: string;
  repoName: string;
  question: string;
  answer: ClaudeAnswer | null;
  error: string | null;
  status: AskStatus;
  createdAt: number;
};

type AskContextValue = {
  records: AskRecord[];
  /** Fire a question; resolves in the background and raises a notification. */
  ask: (repo: Repo, question: string) => void;
  /** Open the answer viewer for a record. */
  view: (id: string) => void;
};

const AskContext = createContext<AskContextValue | null>(null);

let counter = 0;
const nextId = () => `ask_${Date.now().toString(36)}_${(counter++).toString(36)}`;

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

/**
 * Owns the async "Ask Claude" flow app-wide: fires questions, tracks their
 * state, raises a notification when each resolves, and renders the answer
 * viewer. Mounted above the app so answers survive navigation.
 */
export function AskProvider({ children }: { children: ReactNode }) {
  const { notify } = useNotifications();
  const [records, setRecords] = useState<AskRecord[]>([]);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const patch = useCallback((id: string, next: Partial<AskRecord>) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));
  }, []);

  const ask = useCallback(
    (repo: Repo, question: string) => {
      const q = question.trim();
      if (!q) return;
      const id = nextId();
      setRecords((prev) => [
        {
          id,
          repoPath: repo.path,
          repoName: repo.name,
          question: q,
          answer: null,
          error: null,
          status: 'pending',
          createdAt: Date.now(),
        },
        ...prev,
      ]);

      void askClaude(repo.path, q)
        .then((answer) => {
          patch(id, { answer, status: 'ready' });
          notify({
            kind: 'success',
            title: `Answer ready · ${repo.name}`,
            body: q,
            actionLabel: 'View answer',
            onAction: () => setViewingId(id),
          });
        })
        .catch((e) => {
          const message = errorMessage(e);
          patch(id, { error: message, status: 'error' });
          notify({
            kind: 'error',
            title: `Ask failed · ${repo.name}`,
            body: message,
            actionLabel: 'Details',
            onAction: () => setViewingId(id),
          });
        });
    },
    [notify, patch],
  );

  const view = useCallback((id: string) => setViewingId(id), []);

  const value = useMemo<AskContextValue>(() => ({ records, ask, view }), [records, ask, view]);
  const viewing = records.find((r) => r.id === viewingId) ?? null;

  return (
    <AskContext.Provider value={value}>
      {children}
      {viewing && <AnswerModal record={viewing} onClose={() => setViewingId(null)} />}
    </AskContext.Provider>
  );
}

export function useAsk(): AskContextValue {
  const ctx = useContext(AskContext);
  if (!ctx) throw new Error('useAsk must be used within an AskProvider');
  return ctx;
}
