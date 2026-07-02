// TS mirror of the Rust models in src-tauri/src/features/claude/model.rs —
// change both together.

export type SystemPrompt = {
  exists: boolean;
  path: string;
  lines: number;
};

export type McpServer = {
  name: string;
  command: string;
  enabled: boolean;
};

export type Plugin = {
  key: string;
  name: string;
  marketplace: string;
  scope: string;
  enabled: boolean;
};

export type ClaudeStatus = {
  detected: boolean;
  systemPrompt: SystemPrompt;
  mcp: McpServer[];
  plugins: Plugin[];
};

/** Mirrors the Rust `ClaudeAnswer` — a one-shot answer plus run metadata. */
export type ClaudeAnswer = {
  answer: string;
  model: string | null;
  costUsd: number | null;
  durationMs: number | null;
  numTurns: number | null;
  sessionId: string | null;
};

/** MCP scope a repo-scoped server is defined in. */
export type McpScope = 'user' | 'project' | 'local';

/** Mirrors the Rust `RepoMcpServer` — an MCP server visible to one repo. */
export type RepoMcpServer = {
  name: string;
  command: string;
  scope: McpScope;
  enabled: boolean;
};

/** Mirrors the Rust `RepoPlugin` — a plugin's effective state for one repo. */
export type RepoPlugin = {
  key: string;
  name: string;
  marketplace: string;
  scope: string;
  enabled: boolean;
};

/** Mirrors the Rust `RepoClaude` — the Claude Code config for one repo. */
export type RepoClaude = {
  mcp: RepoMcpServer[];
  plugins: RepoPlugin[];
};
