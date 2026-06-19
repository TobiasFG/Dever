// Mock data for the Claude panel. The repos feature is now backed by the real
// Rust backend (see src-ui/features/repos); the MCP panel is still a placeholder
// until that feature is built.

export type McpServer = {
  id: string;
  name: string;
  desc: string;
  on: boolean;
};

export const initialMcp: McpServer[] = [
  { id: 'filesystem', name: 'filesystem', desc: 'local file access', on: true },
  { id: 'github', name: 'github', desc: 'issues, PRs, repos', on: true },
  { id: 'postgres', name: 'postgres', desc: 'dev database', on: false },
  { id: 'puppeteer', name: 'puppeteer', desc: 'browser automation', on: true },
];
