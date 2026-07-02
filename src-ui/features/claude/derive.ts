import { colors } from '@/theme/colors';
import type { ClaudeAnswer, McpServer, Plugin, SystemPrompt } from './types';

/** Status-light dot color for the panel header. */
export function statusDotColor(detected: boolean): string {
  return detected ? colors.green : colors.textFaint;
}

/** Sub-text for the CLAUDE.md card meta. */
export function systemPromptMeta(sp: SystemPrompt): string {
  if (!sp.exists) return 'not created';
  return `${sp.lines} ${sp.lines === 1 ? 'line' : 'lines'} · global`;
}

/** "{active} of {total} active" for the MCP card meta. */
export function mcpMeta(mcp: McpServer[]): string {
  const active = mcp.filter((m) => m.enabled).length;
  return `${active} of ${mcp.length} active`;
}

/** "{enabled} enabled" for the plugins card meta. */
export function pluginMeta(plugins: Plugin[]): string {
  return `${plugins.filter((p) => p.enabled).length} enabled`;
}

/** Indicator dot color for an MCP server row. */
export function dotColor(enabled: boolean): string {
  return enabled ? colors.green : colors.textFaint;
}

/** Friendly model label from a CLI model id (`claude-haiku-4-5-…` → `Haiku`). */
function modelLabel(model: string | null): string | null {
  if (!model) return null;
  const known = ['Haiku', 'Sonnet', 'Opus', 'Fable'].find((m) =>
    model.toLowerCase().includes(m.toLowerCase()),
  );
  return known ?? model;
}

/** The badge line under an answer: "Haiku · 8.4s · $0.012 · 4 turns".
 * Each part is dropped when the CLI didn't report it. */
export function answerMeta(a: ClaudeAnswer): string {
  const parts: string[] = [];
  const model = modelLabel(a.model);
  if (model) parts.push(model);
  if (a.durationMs != null) parts.push(`${(a.durationMs / 1000).toFixed(1)}s`);
  if (a.costUsd != null && a.costUsd > 0)
    parts.push(`$${a.costUsd.toFixed(a.costUsd < 1 ? 4 : 2)}`);
  if (a.numTurns != null) parts.push(`${a.numTurns} ${a.numTurns === 1 ? 'turn' : 'turns'}`);
  return parts.join(' · ');
}
