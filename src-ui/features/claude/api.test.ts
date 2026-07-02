import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

import {
  askClaude,
  claudeStatus,
  readGlobalClaudeMd,
  setMcpEnabled,
  setPluginEnabled,
  writeGlobalClaudeMd,
} from './api';

describe('claude api', () => {
  beforeEach(() => invoke.mockReset());

  it('claudeStatus invokes claude_status', async () => {
    invoke.mockResolvedValue({ detected: true, systemPrompt: {}, mcp: [], plugins: [] });
    await claudeStatus();
    expect(invoke).toHaveBeenCalledWith('claude_status', undefined);
  });

  it('readGlobalClaudeMd invokes read_global_claude_md', async () => {
    invoke.mockResolvedValue('# hi');
    await expect(readGlobalClaudeMd()).resolves.toBe('# hi');
    expect(invoke).toHaveBeenCalledWith('read_global_claude_md', undefined);
  });

  it('writeGlobalClaudeMd passes the content', async () => {
    invoke.mockResolvedValue(undefined);
    await writeGlobalClaudeMd('# new');
    expect(invoke).toHaveBeenCalledWith('write_global_claude_md', { content: '# new' });
  });

  it('setMcpEnabled passes name and enabled', async () => {
    invoke.mockResolvedValue(undefined);
    await setMcpEnabled('github', false);
    expect(invoke).toHaveBeenCalledWith('set_mcp_enabled', { name: 'github', enabled: false });
  });

  it('setPluginEnabled passes key and enabled', async () => {
    invoke.mockResolvedValue(undefined);
    await setPluginEnabled('expo@official', true);
    expect(invoke).toHaveBeenCalledWith('set_plugin_enabled', {
      key: 'expo@official',
      enabled: true,
    });
  });

  it('askClaude passes path and question', async () => {
    invoke.mockResolvedValue({ answer: 'hi', model: null });
    await askClaude('/repo', 'What is this?');
    expect(invoke).toHaveBeenCalledWith('ask_claude', {
      path: '/repo',
      question: 'What is this?',
    });
  });
});
