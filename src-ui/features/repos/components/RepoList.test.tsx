import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { deriveRepo } from '../derive';
import type { Repo } from '../types';
import { RepoList } from './RepoList';

const repo = (name: string, path: string): Repo => ({
  name,
  path,
  branch: 'main',
  upstream: 'origin/main',
  detached: false,
  ahead: 0,
  behind: 0,
  changes: 0,
  conflict: false,
});

function dt() {
  const store: Record<string, string> = {};
  return {
    effectAllowed: 'uninitialized',
    dropEffect: 'none',
    setData: (k: string, v: string) => {
      store[k] = v;
    },
    getData: (k: string) => store[k] ?? '',
  } as unknown as DataTransfer;
}

describe('repo list drag-and-drop', () => {
  it('marks a drop edge on dragover and reorders on drop', () => {
    const onReorder = vi.fn();
    const repos = [repo('a', '/a'), repo('b', '/b'), repo('c', '/c')].map(deriveRepo);
    const { container } = render(
      <RepoList
        repos={repos}
        editors={[]}
        query=""
        loading={false}
        roots={['/root']}
        includeWorktrees={true}
        onAddRoot={() => {}}
        onRescan={() => {}}
        onRemoveRoot={() => {}}
        onToggleWorktrees={() => {}}
        onReorder={onReorder}
        onPull={async () => {}}
        onPullAll={async () => ({ pulled: 0, failed: 0 })}
        onOpen={() => {}}
      />,
    );

    const rows = container.querySelectorAll('.repo-row');
    expect(rows).toHaveLength(3);
    const transfer = dt();

    fireEvent.dragStart(rows[0], { dataTransfer: transfer });
    fireEvent.dragOver(rows[1], { dataTransfer: transfer, clientY: 5 });

    const marked = container.querySelector('.drop-before, .drop-after');
    expect(marked).not.toBeNull();

    fireEvent.drop(rows[1], { dataTransfer: transfer });
    expect(onReorder).toHaveBeenCalledTimes(1);
  });
});

describe('worktree toggle', () => {
  const renderList = (includeWorktrees: boolean, onToggleWorktrees = vi.fn()) =>
    render(
      <RepoList
        repos={[repo('a', '/a')].map(deriveRepo)}
        editors={[]}
        query=""
        loading={false}
        roots={['/root']}
        includeWorktrees={includeWorktrees}
        onAddRoot={() => {}}
        onRescan={() => {}}
        onRemoveRoot={() => {}}
        onToggleWorktrees={onToggleWorktrees}
        onReorder={() => {}}
        onPull={async () => {}}
        onPullAll={async () => ({ pulled: 0, failed: 0 })}
        onOpen={() => {}}
      />,
    );

  it('reflects the current preference', () => {
    const { getByRole } = renderList(true);
    const sw = getByRole('switch', { name: 'Include worktrees' });
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('asks for the opposite of the current preference when clicked', () => {
    const onToggleWorktrees = vi.fn();
    const { getByRole } = renderList(false, onToggleWorktrees);
    fireEvent.click(getByRole('switch', { name: 'Include worktrees' }));
    expect(onToggleWorktrees).toHaveBeenCalledWith(true);
  });
});
