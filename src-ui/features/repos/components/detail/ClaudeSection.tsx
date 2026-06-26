import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { listDocs } from '@/features/docs/api';
import { repoClaude, setRepoMcpEnabled, setRepoPluginEnabled } from '@/features/claude/api';
import { dotColor } from '@/features/claude/derive';
import type {
  ClaudeStatus,
  McpScope,
  RepoClaude,
  RepoMcpServer,
  RepoPlugin,
} from '@/features/claude/types';
import type { Repo } from '../../types';

/** Repo-relative paths of every CLAUDE.md adapter found in the repo. */
function useClaudeFiles(repoPath: string) {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    void listDocs(repoPath)
      .then((nodes) => {
        if (!cancelled)
          setFiles(
            nodes
              .filter((n) => !n.isDir && (n.name === 'CLAUDE.md' || n.name === 'CLAUDE.local.md'))
              .map((n) => n.path),
          );
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [repoPath]);
  return files;
}

/** Repo-scoped Claude config (MCP + plugins, all scopes), re-read every 5s. */
function useRepoClaude(repoPath: string) {
  const [data, setData] = useState<RepoClaude | null>(null);

  const load = useCallback(() => {
    return repoClaude(repoPath)
      .then(setData)
      .catch(() => setData({ mcp: [], plugins: [] }));
  }, [repoPath]);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled) void load();
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [load]);

  const toggleMcp = useCallback(
    async (name: string, scope: McpScope, enabled: boolean) => {
      await setRepoMcpEnabled(repoPath, name, scope, enabled);
      await load();
    },
    [repoPath, load],
  );
  const togglePlugin = useCallback(
    async (key: string, enabled: boolean) => {
      await setRepoPluginEnabled(repoPath, key, enabled);
      await load();
    },
    [repoPath, load],
  );

  return { data, toggleMcp, togglePlugin };
}

// ---- scope grouping ----

// Standard scope vocabulary across the app:
//   Global  — ~/.claude, applies everywhere
//   Project — repo settings, usually committed
//   Local   — folder settings, usually not committed
const SCOPE_LABEL: Record<string, string> = {
  user: 'Global',
  global: 'Global',
  project: 'Project',
  local: 'Local',
};
const scopeLabel = (scope: string) => SCOPE_LABEL[scope] ?? scope;

const MCP_SCOPES: McpScope[] = ['project', 'local', 'user'];
const MCP_SCOPE_LABEL: Record<McpScope, string> = {
  project: 'Project · .mcp.json',
  local: 'Local · private to you',
  user: 'Global · ~/.claude',
};

/** Display label + ordering rank for a CLAUDE.md file by its location. */
function mdScope(rel: string): { label: string; rank: number } {
  if (rel === 'CLAUDE.md') return { label: 'Project', rank: 0 };
  if (rel === 'CLAUDE.local.md') return { label: 'Local', rank: 1 };
  return { label: 'Nested', rank: 2 };
}

const onCount = (rows: { enabled: boolean }[]) => `${rows.filter((r) => r.enabled).length} on`;

export function ClaudeSection({ repo, claude }: { repo: Repo; claude: ClaudeStatus | null }) {
  const files = useClaudeFiles(repo.path);
  const { data, toggleMcp, togglePlugin } = useRepoClaude(repo.path);

  const mcp = data?.mcp ?? [];
  const plugins = data?.plugins ?? [];

  // CLAUDE.md rows: repo files grouped by location, plus the global one.
  const mdRows = [
    ...files.map((f) => ({ path: f, ...mdScope(f) })),
    ...(claude?.systemPrompt.exists
      ? [{ path: claude.systemPrompt.path, label: 'Global', rank: 3 }]
      : []),
  ].sort((a, b) => a.rank - b.rank || a.path.localeCompare(b.path));

  // Plugins grouped by install scope, project-ish scopes first.
  const pluginScopes = [...new Set(plugins.map((p) => p.scope || 'other'))].sort();

  return (
    <div className="section-scroll">
      <div className="section-inner detail-stack">
        {/* CLAUDE.md — display only (Claude Code loads these by location) */}
        <section className="claude-files-section">
          <div className="detail-section-head">
            <h2 className="section-title">
              CLAUDE.md files
              <span className="count-pill">{mdRows.length} files</span>
            </h2>
          </div>
          <div className="card">
            {mdRows.length === 0 ? (
              <div className="card-pad muted-row">No CLAUDE.md files apply to this repo.</div>
            ) : (
              groupBy(mdRows, (r) => r.label).map(([label, rows]) => (
                <div key={label}>
                  <div className="scope-group-head">
                    {label}
                    <span className="scope-group-count">{rows.length} files</span>
                  </div>
                  {rows.map((r) => (
                    <div className="mcp-row" key={r.path}>
                      <div className="mcp-info">
                        <Icon name="file" size={18} color={colors.textSubtle} strokeWidth={1.6} />
                        <div style={{ minWidth: 0 }}>
                          <div className="file-path">{r.path}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </section>

        {/* MCP servers — single card grouped by scope, toggle per repo */}
        <section className="claude-files-section">
          <div className="detail-section-head">
            <h2 className="section-title">
              MCP servers
              <span className="count-pill">{onCount(mcp)}</span>
            </h2>
          </div>
          <div className="card">
            {mcp.length === 0 ? (
              <div className="card-pad muted-row">No MCP servers apply to this repo.</div>
            ) : (
              MCP_SCOPES.map((scope) => {
                const rows = mcp.filter((m) => m.scope === scope);
                if (rows.length === 0) return null;
                return (
                  <div key={scope}>
                    <div className="scope-group-head">
                      {MCP_SCOPE_LABEL[scope]}
                      <span className="scope-group-count">{onCount(rows)}</span>
                    </div>
                    {rows.map((m) => (
                      <McpRow key={`${scope}:${m.name}`} server={m} onToggle={toggleMcp} />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Plugins — effective per-repo state, toggle writes .claude/settings.local.json */}
        <section className="claude-files-section">
          <div className="detail-section-head">
            <h2 className="section-title">
              Plugins
              <span className="count-pill">{onCount(plugins)}</span>
            </h2>
          </div>
          <div className="card">
            {plugins.length === 0 ? (
              <div className="card-pad muted-row">No plugins installed.</div>
            ) : (
              pluginScopes.map((scope) => {
                const rows = plugins.filter((p) => (p.scope || 'other') === scope);
                return (
                  <div key={scope}>
                    <div className="scope-group-head">
                      {scopeLabel(scope)}
                      <span className="scope-group-count">{onCount(rows)}</span>
                    </div>
                    {rows.map((p) => (
                      <PluginRow key={p.key} plugin={p} onToggle={togglePlugin} />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function McpRow({
  server,
  onToggle,
}: {
  server: RepoMcpServer;
  onToggle: (name: string, scope: McpScope, enabled: boolean) => void;
}) {
  return (
    <div className="mcp-row">
      <div className="mcp-info">
        <span
          className="dot"
          style={{ width: 7, height: 7, background: dotColor(server.enabled) }}
        />
        <div style={{ minWidth: 0 }}>
          <div className="mcp-name">{server.name}</div>
          <div className="mcp-desc">{server.command || 'mcp server'}</div>
        </div>
      </div>
      <button
        className={server.enabled ? 'toggle on' : 'toggle'}
        title={`${server.enabled ? 'Disable' : 'Enable'} ${server.name} for this repo`}
        onClick={() => onToggle(server.name, server.scope, !server.enabled)}
      >
        <span className="knob" />
      </button>
    </div>
  );
}

function PluginRow({
  plugin,
  onToggle,
}: {
  plugin: RepoPlugin;
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <div className="mcp-row">
      <div className="mcp-info">
        <span
          className="dot"
          style={{ width: 7, height: 7, background: dotColor(plugin.enabled) }}
        />
        <div style={{ minWidth: 0 }}>
          <div className="mcp-name">{plugin.name}</div>
          <div className="mcp-desc">{plugin.marketplace || 'plugin'}</div>
        </div>
      </div>
      <button
        className={plugin.enabled ? 'toggle on' : 'toggle'}
        title={`${plugin.enabled ? 'Disable' : 'Enable'} ${plugin.name} for this repo`}
        onClick={() => onToggle(plugin.key, !plugin.enabled)}
      >
        <span className="knob" />
      </button>
    </div>
  );
}

/** Stable grouping that preserves first-seen key order. */
function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = groups.get(k);
    if (bucket) bucket.push(item);
    else groups.set(k, [item]);
  }
  return [...groups.entries()];
}
