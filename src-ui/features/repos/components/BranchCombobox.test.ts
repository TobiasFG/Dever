import { describe, expect, it } from 'vitest';
import { filterBranches } from './BranchCombobox';
import type { Branch } from '../types';

const branches: Branch[] = [
  { name: 'main', isRemote: false, isCurrent: true, upstream: 'origin/main' },
  { name: 'feature/login', isRemote: false, isCurrent: false, upstream: null },
  { name: 'origin/main', isRemote: true, isCurrent: false, upstream: null },
  { name: 'origin/release', isRemote: true, isCurrent: false, upstream: null },
];

describe('filterBranches', () => {
  it('shows only local branches when the query is empty', () => {
    const result = filterBranches(branches, '');
    expect(result.map((b) => b.name)).toEqual(['main', 'feature/login']);
  });

  it('treats whitespace-only queries as empty', () => {
    expect(filterBranches(branches, '   ').every((b) => !b.isRemote)).toBe(true);
  });

  it('includes matching remote branches once the user searches', () => {
    const result = filterBranches(branches, 'origin');
    expect(result.map((b) => b.name)).toEqual(['origin/main', 'origin/release']);
  });

  it('matches locals and remotes case-insensitively', () => {
    const result = filterBranches(branches, 'MAIN');
    expect(result.map((b) => b.name)).toEqual(['main', 'origin/main']);
  });
});
