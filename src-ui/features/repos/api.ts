import { call } from '@/lib/ipc';
import type { Repo } from './types';

export const listScanRoots = () => call<string[]>('list_scan_roots');
export const addScanRoot = (path: string) => call<string[]>('add_scan_root', { path });
export const removeScanRoot = (path: string) => call<string[]>('remove_scan_root', { path });
export const scanRepos = () => call<Repo[]>('scan_repos');
