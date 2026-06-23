import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { useBranches } from '../../useBranches';
import type { Branch, Repo } from '../../types';

/** Local branches by default; remote branches surface once the user searches. */
function filterBranches(branches: Branch[], query: string): Branch[] {
  const q = query.toLowerCase().trim();
  return branches.filter((b) => {
    if (!q) return !b.isRemote;
    return b.name.toLowerCase().includes(q);
  });
}

export function BranchesSection({ repo }: { repo: Repo }) {
  const { branches, switching, switchTo, error } = useBranches(repo.path);
  const [query, setQuery] = useState('');
  const localCount = branches.filter((b) => !b.isRemote).length;
  const shown = useMemo(() => filterBranches(branches, query), [branches, query]);

  return (
    <div className="section-scroll">
      <div className="section-inner branches-inner">
        <div className="detail-section-head">
          <h2 className="section-title">
            Switch branch
            <span className="count-pill">{localCount} local</span>
          </h2>
        </div>
        {error && <div className="empty">{error}</div>}
        <div className="card">
          <div className="branches-search">
            <span className="search-icon">
              <Icon name="search" size={15} strokeWidth={2} />
            </span>
            <input
              className="search-input branches-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search branches…"
            />
          </div>
          <div className="branches-list">
            {shown.map((b) => (
              <div key={`${b.isRemote ? 'r' : 'l'}:${b.name}`} className="branch-list-row">
                <span
                  className="dot"
                  style={{ background: b.isCurrent ? colors.green : colors.accent }}
                />
                <div className="branch-list-info">
                  <div className="branch-list-name">{b.name}</div>
                  <div className="branch-list-sub">
                    {b.isRemote ? 'remote' : 'local'}
                    {b.upstream ? ` · ${b.upstream}` : ''}
                  </div>
                </div>
                {b.isCurrent ? (
                  <span className="branch-list-current">current</span>
                ) : (
                  <button
                    className="branch-switch-btn"
                    disabled={switching !== null}
                    onClick={() => void switchTo(b.name, b.isRemote)}
                  >
                    {switching === b.name ? 'Switching…' : 'Switch'}
                  </button>
                )}
              </div>
            ))}
            {shown.length === 0 && (
              <div className="branches-empty">No branches match “{query}”.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
