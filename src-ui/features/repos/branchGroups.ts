import type { Branch } from './types';

/** A branch as the user thinks of it: one name that may exist locally, on one
 * or more remotes, or both. */
export type BranchGroup = {
  /** Short name without any remote prefix (e.g. `feature/login`). */
  name: string;
  isCurrent: boolean;
  local: Branch | null;
  /** Remote-tracking branches for this name, e.g. `origin/feature/login`. */
  remotes: Branch[];
  upstream: string | null;
};

/** `origin/feature/login` → `feature/login`. */
export function shortName(branch: Branch): string {
  if (!branch.isRemote) return branch.name;
  const slash = branch.name.indexOf('/');
  return slash === -1 ? branch.name : branch.name.slice(slash + 1);
}

/** Merge the flat local + remote ref list into one row per branch name, local
 * branches first (in git's order) and remote-only names after them. */
export function groupBranches(branches: Branch[]): BranchGroup[] {
  const byName = new Map<string, BranchGroup>();

  for (const b of branches) {
    const name = shortName(b);
    let group = byName.get(name);
    if (!group) {
      group = { name, isCurrent: false, local: null, remotes: [], upstream: null };
      byName.set(name, group);
    }
    if (b.isRemote) group.remotes.push(b);
    else {
      group.local = b;
      group.upstream = b.upstream;
    }
    if (b.isCurrent) group.isCurrent = true;
  }

  const groups = [...byName.values()];
  return [...groups.filter((g) => g.local !== null), ...groups.filter((g) => g.local === null)];
}

/** Local branches by default; remote-only ones surface once the user searches. */
export function filterGroups(groups: BranchGroup[], query: string): BranchGroup[] {
  const q = query.toLowerCase().trim();
  if (!q) return groups.filter((g) => g.local !== null);
  return groups.filter((g) => g.name.toLowerCase().includes(q));
}
