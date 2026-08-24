import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { filterGroups, groupBranches, type BranchGroup } from '../../branchGroups';
import { useBranches } from '../../useBranches';
import type { Repo } from '../../types';

/** The delete choices offered for a branch, given where it exists. */
function deleteTargets(group: BranchGroup) {
  const targets: { key: string; label: string; local: boolean; remote: boolean }[] = [];
  if (group.local && !group.isCurrent) {
    targets.push({ key: 'local', label: 'Local', local: true, remote: false });
  }
  if (group.remotes.length > 0) {
    targets.push({ key: 'remote', label: 'Remote', local: false, remote: true });
  }
  if (targets.length === 2) {
    targets.push({ key: 'both', label: 'Both', local: true, remote: true });
  }
  return targets;
}

export function BranchesSection({ repo }: { repo: Repo }) {
  const { branches, switching, switchTo, deleting, remove, error } = useBranches(repo.path);
  const [query, setQuery] = useState('');
  /** The branch whose delete confirmation is open, and whether the last local
   * delete failed (so we can offer a force delete). */
  const [confirm, setConfirm] = useState<{ name: string; force: boolean } | null>(null);

  const groups = useMemo(() => groupBranches(branches), [branches]);
  const shown = useMemo(() => filterGroups(groups, query), [groups, query]);
  const localCount = groups.filter((g) => g.local !== null).length;
  const remoteCount = groups.filter((g) => g.remotes.length > 0).length;

  const busy = switching !== null || deleting !== null;

  return (
    <div className="section-scroll">
      <div className="section-inner branches-inner">
        <div className="detail-section-head">
          <h2 className="section-title">
            Branches
            <span className="count-pill">{localCount} local</span>
            <span className="count-pill">{remoteCount} remote</span>
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
            {shown.map((g) => {
              const open = confirm?.name === g.name;
              const targets = deleteTargets(g);
              return (
                <div key={g.name} className="branch-list-row">
                  <span
                    className="dot"
                    style={{ background: g.isCurrent ? colors.green : colors.accent }}
                  />
                  <div className="branch-list-info">
                    <div className="branch-list-name">{g.name}</div>
                    <div className="branch-list-sub">
                      {g.local && <span className="branch-where">local</span>}
                      {g.remotes.map((r) => (
                        <span key={r.name} className="branch-where branch-where-remote">
                          {r.name}
                        </span>
                      ))}
                      {g.upstream && <span className="branch-upstream">↑ {g.upstream}</span>}
                    </div>
                  </div>
                  {open ? (
                    <div className="branch-confirm">
                      <span className="branch-confirm-label">Delete:</span>
                      {targets.map((t) => (
                        <button
                          key={t.key}
                          className="branch-delete-btn"
                          disabled={busy}
                          onClick={() =>
                            void remove(g, {
                              local: t.local,
                              remote: t.remote,
                              force: confirm.force,
                            }).then((ok) => {
                              if (ok) setConfirm(null);
                              else if (t.local) setConfirm({ name: g.name, force: true });
                            })
                          }
                        >
                          {deleting === g.name ? 'Deleting…' : t.label}
                        </button>
                      ))}
                      {confirm.force && <span className="branch-confirm-label">force (-D)</span>}
                      <button
                        className="branch-switch-btn"
                        disabled={busy}
                        onClick={() => setConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {g.isCurrent ? (
                        <span className="branch-list-current">current</span>
                      ) : (
                        <button
                          className="branch-switch-btn"
                          disabled={busy}
                          onClick={() =>
                            void switchTo(
                              g.local ? g.local.name : g.remotes[0].name,
                              g.local === null,
                            )
                          }
                        >
                          {switching === g.name ? 'Switching…' : 'Switch'}
                        </button>
                      )}
                      {targets.length > 0 && (
                        <button
                          className="branch-delete-btn"
                          title="Delete branch"
                          disabled={busy}
                          onClick={() => setConfirm({ name: g.name, force: false })}
                        >
                          <Icon name="trash" size={13} strokeWidth={1.8} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="branches-empty">No branches match “{query}”.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
