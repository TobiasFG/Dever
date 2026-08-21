import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Menu, type MenuItem } from '@/components/Menu';
import { Popover } from '@/components/Popover';
import { listSolutions, openInEditor } from '../api';
import type { Editor, Solution } from '../types';

/** The editor id Visual Studio is detected under in `editors.rs`. Visual Studio
 * opens a solution or project file rather than the repo folder, so it gets the
 * solution picker instead of a plain "open this path" action. */
export const VISUAL_STUDIO_ID = 'visualstudio';

/** Case-insensitive substring match on the repo-relative path. Pure so it can
 * be unit-tested directly. */
export function filterSolutions(solutions: Solution[], query: string): Solution[] {
  const q = query.trim().toLowerCase();
  if (!q) return solutions;
  return solutions.filter((s) => s.relPath.toLowerCase().includes(q));
}

/**
 * Lists the `.sln`/`.csproj` files found in a repo and opens the picked one in
 * Visual Studio. A repo with exactly one target has nothing to pick, so the
 * panel opens it straight away and closes itself.
 */
export function SolutionPanel({ repoPath, close }: { repoPath: string; close: () => void }) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Launching Visual Studio is not idempotent, so the single-target shortcut
  // fires at most once per panel — effects run twice under StrictMode in dev.
  const autoOpened = useRef(false);

  useEffect(() => {
    // The panel mounts fresh each time the popover opens, so `loading` starts
    // true — fetch once and clear it when the request settles.
    let active = true;
    listSolutions(repoPath)
      .then((found) => {
        if (!active) return;
        setSolutions(found);
        if (found.length === 1 && !autoOpened.current) {
          autoOpened.current = true;
          void openInEditor(found[0].path, VISUAL_STUDIO_ID);
          close();
        }
      })
      .catch((e) => active && setError(String(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repoPath, close]);

  const open = (s: Solution) => {
    void openInEditor(s.path, VISUAL_STUDIO_ID);
    close();
  };

  const visible = filterSolutions(solutions, query);

  return (
    <div className="combobox">
      <input
        className="combobox-input"
        autoFocus
        placeholder="Search solutions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="combobox-list">
        {loading ? (
          <div className="combobox-empty">Loading…</div>
        ) : error ? (
          <div className="combobox-empty">{error}</div>
        ) : solutions.length === 0 ? (
          <div className="combobox-empty">No solution or project found.</div>
        ) : visible.length === 0 ? (
          <div className="combobox-empty">Nothing matches.</div>
        ) : (
          visible.map((s) => (
            <button
              key={s.path}
              type="button"
              className="combobox-item"
              role="option"
              aria-selected={false}
              onClick={() => open(s)}
            >
              <Icon name="file" size={12} color="var(--text-muted)" strokeWidth={1.8} />
              <span className="combobox-name">{s.relPath}</span>
              {s.kind === 'project' && <span className="combobox-tag">project</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Build the editor rows for a popover. Visual Studio keeps the popover open so
 * it can swap to the solution picker; every other editor opens the repo folder. */
export function editorItems(
  repoPath: string,
  editors: Editor[],
  showSolutions: () => void,
  label: (name: string) => string = (name) => name,
): MenuItem[] {
  return editors.map((e) => ({
    icon: 'editor',
    label: label(e.name),
    keepOpen: e.id === VISUAL_STUDIO_ID,
    onSelect: () =>
      e.id === VISUAL_STUDIO_ID ? showSolutions() : void openInEditor(repoPath, e.id),
  }));
}

/** The detected editors as a popover panel, swapping to the solution picker
 * when Visual Studio is chosen. */
export function EditorMenuPanel({
  repoPath,
  editors,
  close,
}: {
  repoPath: string;
  editors: Editor[];
  close: () => void;
}) {
  const [view, setView] = useState<'menu' | 'solutions'>('menu');

  if (view === 'solutions') {
    return <SolutionPanel repoPath={repoPath} close={close} />;
  }
  if (editors.length === 0) {
    return (
      <div className="menu">
        <div className="menu-empty">No editors found</div>
      </div>
    );
  }
  return <Menu close={close} items={editorItems(repoPath, editors, () => setView('solutions'))} />;
}

/** Icon-button dropdown listing the editors detected on this machine. */
export function EditorMenuButton({ repoPath, editors }: { repoPath: string; editors: Editor[] }) {
  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button
          type="button"
          className="icon-btn"
          title="Open in editor"
          aria-expanded={open}
          onClick={toggle}
        >
          <Icon name="editor" size={14} strokeWidth={1.8} />
        </button>
      )}
    >
      {(close) => <EditorMenuPanel repoPath={repoPath} editors={editors} close={close} />}
    </Popover>
  );
}
