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
  dotColor: string;
};

export function deriveRepo(r: Repo): RepoView {
  const isDirty = r.changes > 0;
  const clean = !isDirty && r.ahead === 0 && r.behind === 0 && !r.conflict;
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
    dotColor: r.conflict
      ? colors.red
      : isDirty
        ? colors.yellow
        : r.ahead > 0 || r.behind > 0
          ? colors.accent
          : colors.green,
  };
}
