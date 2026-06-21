import { describe, expect, it } from 'vitest';
import { mcpMeta, pluginMeta, statusDotColor, systemPromptMeta } from './derive';
import { colors } from '@/theme/colors';
import type { McpServer, Plugin } from './types';

describe('claude derive', () => {
  it('statusDotColor reflects detection', () => {
    expect(statusDotColor(true)).toBe(colors.green);
    expect(statusDotColor(false)).toBe(colors.textFaint);
  });

  it('systemPromptMeta handles existing, missing, and singular line', () => {
    expect(systemPromptMeta({ exists: false, path: 'p', lines: 0 })).toBe('not created');
    expect(systemPromptMeta({ exists: true, path: 'p', lines: 1 })).toBe('1 line · global');
    expect(systemPromptMeta({ exists: true, path: 'p', lines: 42 })).toBe('42 lines · global');
  });

  it('mcpMeta counts active of total', () => {
    const mcp: McpServer[] = [
      { name: 'a', command: '', enabled: true },
      { name: 'b', command: '', enabled: false },
      { name: 'c', command: '', enabled: true },
    ];
    expect(mcpMeta(mcp)).toBe('2 of 3 active');
    expect(mcpMeta([])).toBe('0 of 0 active');
  });

  it('pluginMeta counts enabled', () => {
    const plugins: Plugin[] = [
      { key: 'a@m', name: 'a', marketplace: 'm', scope: 'user', enabled: true },
      { key: 'b@m', name: 'b', marketplace: 'm', scope: 'user', enabled: false },
    ];
    expect(pluginMeta(plugins)).toBe('1 enabled');
  });
});
