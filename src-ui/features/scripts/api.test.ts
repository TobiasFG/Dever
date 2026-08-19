import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

import {
  getScriptsRoot,
  listGlobalScripts,
  listRepoScripts,
  runScript,
  setScriptsRoot,
} from './api';

describe('scripts api', () => {
  beforeEach(() => invoke.mockReset());

  it('listRepoScripts passes the path argument', async () => {
    invoke.mockResolvedValue([]);
    await listRepoScripts('/code/app');
    expect(invoke).toHaveBeenCalledWith('list_repo_scripts', { path: '/code/app' });
  });

  it('listGlobalScripts invokes list_global_scripts', async () => {
    invoke.mockResolvedValue([]);
    await listGlobalScripts();
    expect(invoke).toHaveBeenCalledWith('list_global_scripts', undefined);
  });

  it('getScriptsRoot invokes get_scripts_root', async () => {
    invoke.mockResolvedValue('/scripts');
    await expect(getScriptsRoot()).resolves.toBe('/scripts');
    expect(invoke).toHaveBeenCalledWith('get_scripts_root', undefined);
  });

  it('setScriptsRoot passes the path argument', async () => {
    invoke.mockResolvedValue(undefined);
    await setScriptsRoot('/scripts');
    expect(invoke).toHaveBeenCalledWith('set_scripts_root', { path: '/scripts' });
  });

  it('setScriptsRoot forwards null to clear the folder', async () => {
    invoke.mockResolvedValue(undefined);
    await setScriptsRoot(null);
    expect(invoke).toHaveBeenCalledWith('set_scripts_root', { path: null });
  });

  it('runScript passes path and cwd', async () => {
    invoke.mockResolvedValue({});
    await runScript('/code/app/scripts/build.ps1', '/code/app');
    expect(invoke).toHaveBeenCalledWith('run_script', {
      path: '/code/app/scripts/build.ps1',
      cwd: '/code/app',
    });
  });
});
