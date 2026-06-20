import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

import {
  addScanRoot,
  listBranches,
  listScanRoots,
  openInEditor,
  openTerminal,
  removeScanRoot,
  revealInFileManager,
  scanRepos,
  switchBranch,
} from './api';

describe('repos api', () => {
  beforeEach(() => invoke.mockReset());

  it('scanRepos invokes scan_repos', async () => {
    invoke.mockResolvedValue([]);
    await scanRepos();
    expect(invoke).toHaveBeenCalledWith('scan_repos', undefined);
  });

  it('listScanRoots invokes list_scan_roots', async () => {
    invoke.mockResolvedValue(['/code']);
    await expect(listScanRoots()).resolves.toEqual(['/code']);
    expect(invoke).toHaveBeenCalledWith('list_scan_roots', undefined);
  });

  it('addScanRoot passes the path argument', async () => {
    invoke.mockResolvedValue(['/code']);
    await addScanRoot('/code');
    expect(invoke).toHaveBeenCalledWith('add_scan_root', { path: '/code' });
  });

  it('removeScanRoot passes the path argument', async () => {
    invoke.mockResolvedValue([]);
    await removeScanRoot('/code');
    expect(invoke).toHaveBeenCalledWith('remove_scan_root', { path: '/code' });
  });

  it('listBranches passes the path argument', async () => {
    invoke.mockResolvedValue([]);
    await listBranches('/code/app');
    expect(invoke).toHaveBeenCalledWith('list_branches', { path: '/code/app' });
  });

  it('switchBranch passes path, name and isRemote', async () => {
    invoke.mockResolvedValue(undefined);
    await switchBranch('/code/app', 'origin/feat', true);
    expect(invoke).toHaveBeenCalledWith('switch_branch', {
      path: '/code/app',
      name: 'origin/feat',
      isRemote: true,
    });
  });

  it('openInEditor passes path and editorId', async () => {
    invoke.mockResolvedValue(undefined);
    await openInEditor('/code/app', 'vscode');
    expect(invoke).toHaveBeenCalledWith('open_in_editor', {
      path: '/code/app',
      editorId: 'vscode',
    });
  });

  it('openTerminal passes the path argument', async () => {
    invoke.mockResolvedValue(undefined);
    await openTerminal('/code/app');
    expect(invoke).toHaveBeenCalledWith('open_terminal', { path: '/code/app' });
  });

  it('revealInFileManager passes the path argument', async () => {
    invoke.mockResolvedValue(undefined);
    await revealInFileManager('/code/app');
    expect(invoke).toHaveBeenCalledWith('reveal_in_file_manager', { path: '/code/app' });
  });
});
