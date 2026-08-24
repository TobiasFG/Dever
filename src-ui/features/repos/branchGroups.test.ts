import { describe, expect, it } from 'vitest';
import { filterGroups, groupBranches, shortName } from './branchGroups';
import type { Branch } from './types';

const branches: Branch[] = [
  { name: 'main', isRemote: false, isCurrent: true, upstream: 'origin/main' },
  { name: 'feature/login', isRemote: false, isCurrent: false, upstream: null },
  { name: 'origin/main', isRemote: true, isCurrent: false, upstream: null },
  { name: 'origin/feature/login', isRemote: true, isCurrent: false, upstream: null },
  { name: 'origin/release', isRemote: true, isCurrent: false, upstream: null },
];

describe('shortName', () => {
  it('strips the remote prefix from remote branches only', () => {
    expect(shortName(branches[3])).toBe('feature/login');
    expect(shortName(branches[1])).toBe('feature/login');
  });
});

describe('groupBranches', () => {
  it('merges a local branch and its remote counterpart into one row', () => {
    const groups = groupBranches(branches);
    expect(groups.map((g) => g.name)).toEqual(['main', 'feature/login', 'release']);

    const main = groups[0];
    expect(main.isCurrent).toBe(true);
    expect(main.local?.name).toBe('main');
    expect(main.remotes.map((r) => r.name)).toEqual(['origin/main']);
    expect(main.upstream).toBe('origin/main');
  });

  it('keeps remote-only branches, with no local side', () => {
    const release = groupBranches(branches)[2];
    expect(release.local).toBeNull();
    expect(release.remotes.map((r) => r.name)).toEqual(['origin/release']);
  });

  it('lists local branches before remote-only ones', () => {
    const groups = groupBranches([branches[4], branches[1]]);
    expect(groups.map((g) => g.name)).toEqual(['feature/login', 'release']);
  });
});

describe('filterGroups', () => {
  it('shows only branches that exist locally when the query is empty', () => {
    const groups = filterGroups(groupBranches(branches), '  ');
    expect(groups.map((g) => g.name)).toEqual(['main', 'feature/login']);
  });

  it('includes remote-only branches once the user searches', () => {
    const groups = filterGroups(groupBranches(branches), 'rel');
    expect(groups.map((g) => g.name)).toEqual(['release']);
  });
});
