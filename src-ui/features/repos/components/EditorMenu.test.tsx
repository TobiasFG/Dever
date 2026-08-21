import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Editor, Solution } from '../types';
import { EditorMenuPanel, filterSolutions } from './EditorMenu';

const { listSolutions, openInEditor } = vi.hoisted(() => ({
  listSolutions: vi.fn(),
  openInEditor: vi.fn(),
}));
vi.mock('../api', () => ({ listSolutions, openInEditor }));

const editors: Editor[] = [
  { id: 'vscode', name: 'VS Code' },
  { id: 'visualstudio', name: 'Visual Studio' },
];

const solution = (relPath: string, kind: Solution['kind'] = 'solution'): Solution => ({
  path: `/code/app/${relPath}`,
  name: relPath.split('/').pop()!,
  relPath,
  kind,
});

describe('filterSolutions', () => {
  const all = [solution('App.sln'), solution('src/App/App.csproj', 'project')];

  it('returns everything for an empty query', () => {
    expect(filterSolutions(all, '  ')).toEqual(all);
  });

  it('matches the relative path case-insensitively', () => {
    expect(filterSolutions(all, 'src/app')).toEqual([all[1]]);
    expect(filterSolutions(all, 'SLN')).toEqual([all[0]]);
  });

  it('returns nothing when no path matches', () => {
    expect(filterSolutions(all, 'nope')).toEqual([]);
  });
});

describe('editor menu', () => {
  beforeEach(() => {
    listSolutions.mockReset();
    openInEditor.mockReset();
    openInEditor.mockResolvedValue(undefined);
  });

  const renderPanel = (close = vi.fn()) => {
    render(<EditorMenuPanel repoPath="/code/app" editors={editors} close={close} />);
    return close;
  };

  it('opens the repo folder in a non-Visual-Studio editor', () => {
    renderPanel();
    fireEvent.click(screen.getByText('VS Code'));
    expect(openInEditor).toHaveBeenCalledWith('/code/app', 'vscode');
    expect(listSolutions).not.toHaveBeenCalled();
  });

  it('lets the user pick when the repo has several solutions', async () => {
    listSolutions.mockResolvedValue([solution('App.sln'), solution('Other.sln')]);
    const close = renderPanel();

    fireEvent.click(screen.getByText('Visual Studio'));

    const pick = await screen.findByText('Other.sln');
    expect(openInEditor).not.toHaveBeenCalled();

    fireEvent.click(pick);
    expect(openInEditor).toHaveBeenCalledWith('/code/app/Other.sln', 'visualstudio');
    expect(close).toHaveBeenCalled();
  });

  it('opens the only solution straight away', async () => {
    listSolutions.mockResolvedValue([solution('App.sln')]);
    const close = renderPanel();

    fireEvent.click(screen.getByText('Visual Studio'));

    await waitFor(() =>
      expect(openInEditor).toHaveBeenCalledWith('/code/app/App.sln', 'visualstudio'),
    );
    expect(openInEditor).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalled();
  });

  it('says so when the repo has no solution or project', async () => {
    listSolutions.mockResolvedValue([]);
    renderPanel();

    fireEvent.click(screen.getByText('Visual Studio'));

    expect(await screen.findByText('No solution or project found.')).toBeTruthy();
    expect(openInEditor).not.toHaveBeenCalled();
  });

  it('shows the error when the scan fails', async () => {
    listSolutions.mockRejectedValue('scan blew up');
    renderPanel();

    fireEvent.click(screen.getByText('Visual Studio'));

    expect(await screen.findByText('scan blew up')).toBeTruthy();
  });
});
