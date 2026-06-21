import { colors } from '@/theme/colors';
import type { McpServer, Plugin, SystemPrompt } from './types';

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
