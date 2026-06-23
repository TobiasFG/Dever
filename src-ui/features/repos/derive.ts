import { colors } from '@/theme/colors';
import type { Repo } from './types';

/** View model for a repo row — pure presentation derived from the raw status. */
export type RepoView = {
  name: string;
  path: string;
  branch: string;
  ahead: number;
  behind: number;
  changes: number;
  showChanges: boolean;
  showAhead: boolean;
  showBehind: boolean;
  showConflict: boolean;
  clean: boolean;
  /** Safe to fast-forward: behind its upstream, with no local changes,
   * conflicts, or ahead commits that would make the pull a non-fast-forward. */
  canPull: boolean;
  dotColor: string;
};

export function deriveRepo(r: Repo): RepoView {
  const isDirty = r.changes > 0;
  const clean = !isDirty && r.ahead === 0 && r.behind === 0 && !r.conflict;
  const canPull = !isDirty && !r.conflict && r.behind > 0 && r.ahead === 0;
  return {
    name: r.name,
    path: r.path,
    branch: r.detached ? 'detached' : (r.branch ?? '—'),
    ahead: r.ahead,
    behind: r.behind,
    changes: r.changes,
    showChanges: isDirty,
    showAhead: r.ahead > 0,
    showBehind: r.behind > 0,
    showConflict: r.conflict,
    clean,
    canPull,
    dotColor: r.conflict
      ? colors.red
      : isDirty
        ? colors.yellow
        : r.ahead > 0 || r.behind > 0
          ? colors.accent
          : colors.green,
  };
}

/** View model for the repo-detail identity header — status label, colors, and
 * the git-status grid values. */
export type RepoDetailView = {
  name: string;
  path: string;
  branch: string;
  upstreamText: string;
  ahead: number;
  behind: number;
  aheadColor: string;
  behindColor: string;
  changesValue: string;
  changesColor: string;
  hasConflict: boolean;
  canPull: boolean;
  dotColor: string;
  statusText: string;
  statusFg: string;
  statusBg: string;
};

export function deriveDetail(r: Repo): RepoDetailView {
  const isDirty = r.changes > 0;
  const conflict = r.conflict;
  const outOfSync = r.ahead > 0 || r.behind > 0;

  let statusText: string;
  let statusFg: string;
  let statusBg: string;
  if (conflict) {
    statusText = 'Merge conflict';
    statusFg = colors.red;
    statusBg = 'rgba(248,113,104,0.13)';
  } else if (isDirty) {
    statusText = 'Uncommitted changes';
    statusFg = colors.yellow;
    statusBg = 'rgba(245,205,71,0.12)';
  } else if (outOfSync) {
    statusText = 'Out of sync';
    statusFg = colors.accent;
    statusBg = 'rgba(87,157,255,0.14)';
  } else {
    statusText = 'Clean';
    statusFg = colors.pillOnGreen;
    statusBg = colors.pillBgGreen;
  }

  return {
    name: r.name,
    path: r.path,
    branch: r.detached ? 'detached HEAD' : (r.branch ?? '—'),
    upstreamText: r.detached ? 'detached HEAD' : (r.upstream ?? 'no upstream'),
    ahead: r.ahead,
    behind: r.behind,
    aheadColor: r.ahead > 0 ? colors.text : colors.textFaint,
    behindColor: r.behind > 0 ? colors.text : colors.textFaint,
    changesValue: isDirty ? `${r.changes} file${r.changes === 1 ? '' : 's'}` : 'None',
    changesColor: isDirty ? colors.yellow : colors.green,
    hasConflict: conflict,
    canPull: !isDirty && !conflict && r.behind > 0 && r.ahead === 0,
    dotColor: conflict
      ? colors.red
      : isDirty
        ? colors.yellow
        : outOfSync
          ? colors.accent
          : colors.green,
    statusText,
    statusFg,
    statusBg,
  };
}
