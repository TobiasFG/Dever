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
