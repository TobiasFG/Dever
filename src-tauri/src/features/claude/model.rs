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

/// One Claude Code config snapshot scoped to a single repository: the MCP
/// servers and plugins that apply when Claude Code runs in that repo, across
/// every scope. Mirrored in `src-ui/features/claude/types.ts`.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoClaude {
    pub mcp: Vec<RepoMcpServer>,
    pub plugins: Vec<RepoPlugin>,
}

/// An MCP server visible to a repo, tagged with the scope it's defined in:
/// - `"user"`    — `~/.claude.json` top-level `mcpServers` (disabled per-repo
///   via `projects[path].disabledMcpServers`)
/// - `"project"` — the repo's `.mcp.json` (toggled per-repo via
///   `projects[path].enabledMcpjsonServers` / `disabledMcpjsonServers`)
/// - `"local"`   — `~/.claude.json` `projects[path].mcpServers` (private to the
///   user for this repo; disabled by stashing the definition aside)
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoMcpServer {
    pub name: String,
    pub command: String,
    pub scope: String,
    pub enabled: bool,
}

/// An installed plugin with its *effective* enabled state for a repo, after
/// merging user `settings.json`, the repo's `.claude/settings.json`, and
/// `.claude/settings.local.json`. `scope` is the plugin's install scope.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoPlugin {
    pub key: String,
    pub name: String,
    pub marketplace: String,
    pub scope: String,
    pub enabled: bool,
}
