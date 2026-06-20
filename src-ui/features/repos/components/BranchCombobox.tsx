import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Popover } from '@/components/Popover';
import { listBranches, switchBranch } from '../api';
import type { RepoView } from '../derive';
import type { Branch } from '../types';

/**
 * Local branches show by default; once the user types, remote branches that
 * match are included too. Pure so it can be unit-tested directly.
 */
export function filterBranches(branches: Branch[], query: string): Branch[] {
  const q = query.trim().toLowerCase();
  if (!q) return branches.filter((b) => !b.isRemote);
  return branches.filter((b) => b.name.toLowerCase().includes(q));
}

export function BranchPanel({
  repo,
  close,
  onSwitched,
}: {
  repo: RepoView;
  close: () => void;
  onSwitched: () => void;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The panel mounts fresh each time the popover opens, so `loading` starts
    // true — fetch once and clear it when the request settles.
    let active = true;
    listBranches(repo.path)
      .then((b) => active && setBranches(b))
      .catch((e) => active && setError(String(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repo.path]);

  const select = async (b: Branch) => {
    if (b.isCurrent) {
      close();
      return;
    }
    try {
      await switchBranch(repo.path, b.name, b.isRemote);
      close();
      onSwitched();
    } catch (e) {
      setError(String(e));
    }
  };

  const visible = filterBranches(branches, query);
  const others = branches.filter((b) => !b.isCurrent);

  return (
    <div className="combobox">
      <input
        className="combobox-input"
        autoFocus
        placeholder="Search branches…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="combobox-list">
        {loading ? (
          <div className="combobox-empty">Loading…</div>
        ) : error ? (
          <div className="combobox-empty">{error}</div>
        ) : others.length === 0 ? (
          <div className="combobox-empty">This is the only branch.</div>
        ) : visible.length === 0 ? (
          <div className="combobox-empty">No branches match.</div>
        ) : (
          visible.map((b) => (
            <button
              key={(b.isRemote ? 'r:' : 'l:') + b.name}
              type="button"
              className="combobox-item"
              role="option"
              aria-selected={b.isCurrent}
              onClick={() => select(b)}
            >
              <Icon name="branch" size={12} color="var(--text-muted)" strokeWidth={1.8} />
              <span className="combobox-name">{b.name}</span>
              {b.isRemote && <span className="combobox-tag">remote</span>}
              {b.isCurrent && (
                <Icon name="check" size={13} color="var(--green)" strokeWidth={2.4} />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Switch-branch trigger + combobox. Disabled when the repo is dirty. */
export function BranchCombobox({ repo, onSwitched }: { repo: RepoView; onSwitched: () => void }) {
  const disabled = repo.changes > 0;
  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button
          type="button"
          className="icon-btn"
          title={disabled ? 'Commit or stash changes to switch branch' : 'Switch branch'}
          aria-expanded={open}
          disabled={disabled}
          onClick={toggle}
        >
          <Icon name="swap" size={14} strokeWidth={1.8} />
        </button>
      )}
    >
      {(close) => <BranchPanel repo={repo} close={close} onSwitched={onSwitched} />}
    </Popover>
  );
}
