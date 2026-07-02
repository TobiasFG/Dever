import { call } from '@/lib/ipc';
import type { ClaudeAnswer, ClaudeStatus, McpScope, RepoClaude } from './types';

export const claudeStatus = () => call<ClaudeStatus>('claude_status');
export const readGlobalClaudeMd = () => call<string>('read_global_claude_md');
export const writeGlobalClaudeMd = (content: string) =>
  call<void>('write_global_claude_md', { content });
export const setMcpEnabled = (name: string, enabled: boolean) =>
  call<void>('set_mcp_enabled', { name, enabled });
export const setPluginEnabled = (key: string, enabled: boolean) =>
  call<void>('set_plugin_enabled', { key, enabled });

/** Claude Code config (MCP + plugins, all scopes) for one repo. */
export const repoClaude = (path: string) => call<RepoClaude>('repo_claude', { path });
export const setRepoMcpEnabled = (path: string, name: string, scope: McpScope, enabled: boolean) =>
  call<void>('set_repo_mcp_enabled', { path, name, scope, enabled });
export const setRepoPluginEnabled = (path: string, key: string, enabled: boolean) =>
  call<void>('set_repo_plugin_enabled', { path, key, enabled });

/** Ask Claude Code (Haiku, read-only) a one-shot question about a repo. */
export const askClaude = (path: string, question: string) =>
  call<ClaudeAnswer>('ask_claude', { path, question });
