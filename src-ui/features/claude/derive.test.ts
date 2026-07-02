import { describe, expect, it } from 'vitest';
import { answerMeta, mcpMeta, pluginMeta, statusDotColor, systemPromptMeta } from './derive';
import { colors } from '@/theme/colors';
import type { ClaudeAnswer, McpServer, Plugin } from './types';

const answer = (over: Partial<ClaudeAnswer>): ClaudeAnswer => ({
  answer: 'a',
  model: null,
  costUsd: null,
  durationMs: null,
  numTurns: null,
  sessionId: null,
  ...over,
});

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

  it('answerMeta builds a label from the parts the CLI reported', () => {
    expect(
      answerMeta(
        answer({
          model: 'claude-haiku-4-5-20251001',
          durationMs: 8421,
          costUsd: 0.0123,
          numTurns: 4,
        }),
      ),
    ).toBe('Haiku · 8.4s · $0.0123 · 4 turns');
  });

  it('answerMeta drops missing parts and singularizes one turn', () => {
    expect(answerMeta(answer({ durationMs: 1000, numTurns: 1 }))).toBe('1.0s · 1 turn');
    expect(answerMeta(answer({ model: 'claude-sonnet-4-6' }))).toBe('Sonnet');
    expect(answerMeta(answer({ costUsd: 0 }))).toBe('');
  });
});
