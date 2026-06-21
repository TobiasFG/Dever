use serde::Serialize;

/// A snapshot of the machine's Claude Code (CLI) configuration. Mirrored in
/// `src-ui/features/claude/types.ts` — change both together.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeStatus {
    pub detected: bool,
    pub system_prompt: SystemPrompt,
    pub mcp: Vec<McpServer>,
    pub plugins: Vec<Plugin>,
}

/// The global `~/.claude/CLAUDE.md` memory file. `path` is a display string.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemPrompt {
    pub exists: bool,
    pub path: String,
    pub lines: u32,
}

/// A user-scoped MCP server from `~/.claude.json`. `command` is shown as the
/// row's sub-text; `enabled` is false when stashed out of the live config.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServer {
    pub name: String,
    pub command: String,
    pub enabled: bool,
}

/// An installed Claude Code plugin. `key` is the `"name@marketplace"` registry
/// key used to toggle the plugin's enabled state.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Plugin {
    pub key: String,
    pub name: String,
    pub marketplace: String,
    pub scope: String,
    pub enabled: bool,
}
