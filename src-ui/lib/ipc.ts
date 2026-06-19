import { invoke } from '@tauri-apps/api/core';

/**
 * Single chokepoint for backend calls. Feature `api.ts` modules call through
 * here; components and hooks never call `invoke` directly.
 */
export function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(command, args);
}
