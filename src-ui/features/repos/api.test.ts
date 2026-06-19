import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

import { addScanRoot, listScanRoots, removeScanRoot, scanRepos } from './api';

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
});
