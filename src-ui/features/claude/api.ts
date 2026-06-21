import { call } from '@/lib/ipc';
import type { ClaudeStatus } from './types';

export const claudeStatus = () => call<ClaudeStatus>('claude_status');
export const readGlobalClaudeMd = () => call<string>('read_global_claude_md');
export const writeGlobalClaudeMd = (content: string) =>
  call<void>('write_global_claude_md', { content });
export const setMcpEnabled = (name: string, enabled: boolean) =>
  call<void>('set_mcp_enabled', { name, enabled });
export const setPluginEnabled = (key: string, enabled: boolean) =>
  call<void>('set_plugin_enabled', { key, enabled });
