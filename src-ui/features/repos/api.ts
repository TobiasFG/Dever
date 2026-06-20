import { call } from '@/lib/ipc';
import type { Branch, Editor, Repo } from './types';

export const listScanRoots = () => call<string[]>('list_scan_roots');
export const addScanRoot = (path: string) => call<string[]>('add_scan_root', { path });
export const removeScanRoot = (path: string) => call<string[]>('remove_scan_root', { path });
export const scanRepos = () => call<Repo[]>('scan_repos');

export const listBranches = (path: string) => call<Branch[]>('list_branches', { path });
export const switchBranch = (path: string, name: string, isRemote: boolean) =>
  call<void>('switch_branch', { path, name, isRemote });
export const listEditors = () => call<Editor[]>('list_editors');
export const openInEditor = (path: string, editorId: string) =>
  call<void>('open_in_editor', { path, editorId });
export const openTerminal = (path: string) => call<void>('open_terminal', { path });
export const revealInFileManager = (path: string) => call<void>('reveal_in_file_manager', { path });
