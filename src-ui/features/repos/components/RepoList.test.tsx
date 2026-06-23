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
        onAddRoot={() => {}}
        onRescan={() => {}}
        onRemoveRoot={() => {}}
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
