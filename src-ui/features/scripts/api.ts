import { call } from '@/lib/ipc';
import type { Script, ScriptResult } from './types';

export const listRepoScripts = (path: string) => call<Script[]>('list_repo_scripts', { path });
export const listGlobalScripts = () => call<Script[]>('list_global_scripts');
export const getScriptsRoot = () => call<string | null>('get_scripts_root');
export const setScriptsRoot = (path: string | null) => call<void>('set_scripts_root', { path });
export const runScript = (path: string, cwd: string) =>
  call<ScriptResult>('run_script', { path, cwd });
