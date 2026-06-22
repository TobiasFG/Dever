import { describe, expect, it } from 'vitest';
import { colors } from '@/theme/colors';
import { deriveRepo } from './derive';
import type { Repo } from './types';

const base: Repo = {
  name: 'acme',
  path: '/code/acme',
  branch: 'main',
  upstream: 'origin/main',
  ahead: 0,
  behind: 0,
  changes: 0,
  conflict: false,
  detached: false,
};

describe('deriveRepo', () => {
  it('marks a synced repo as clean and green', () => {
    const v = deriveRepo(base);
    expect(v.clean).toBe(true);
    expect(v.dotColor).toBe(colors.green);
    expect(v.showChanges).toBe(false);
  });

  it('flags uncommitted changes as yellow', () => {
    const v = deriveRepo({ ...base, changes: 3 });
    expect(v.clean).toBe(false);
    expect(v.showChanges).toBe(true);
    expect(v.dotColor).toBe(colors.yellow);
  });

  it('uses accent when ahead/behind but otherwise clean', () => {
    const v = deriveRepo({ ...base, ahead: 2, behind: 1 });
    expect(v.showAhead).toBe(true);
    expect(v.showBehind).toBe(true);
    expect(v.dotColor).toBe(colors.accent);
  });

  it('conflict wins the color and shows the badge', () => {
    const v = deriveRepo({ ...base, changes: 1, conflict: true });
    expect(v.showConflict).toBe(true);
    expect(v.dotColor).toBe(colors.red);
  });

  it('shows "detached" label for a detached head', () => {
    const v = deriveRepo({ ...base, branch: null, detached: true });
    expect(v.branch).toBe('detached');
  });

  it('can pull when behind with a clean fast-forward', () => {
    expect(deriveRepo({ ...base, behind: 2 }).canPull).toBe(true);
  });

  it('cannot pull when diverged, dirty, or conflicted', () => {
    expect(deriveRepo({ ...base, behind: 2, ahead: 1 }).canPull).toBe(false);
    expect(deriveRepo({ ...base, behind: 2, changes: 1 }).canPull).toBe(false);
    expect(deriveRepo({ ...base, behind: 2, conflict: true }).canPull).toBe(false);
    expect(deriveRepo({ ...base, behind: 0 }).canPull).toBe(false);
  });
});
