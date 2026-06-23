import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { listDocs } from '@/features/docs/api';
import { dotColor, mcpMeta, pluginMeta } from '@/features/claude/derive';
import type { ClaudeStatus } from '@/features/claude/types';
import type { Repo } from '../../types';

/** Repo-relative paths of every CLAUDE.md adapter found in the repo. */
function useClaudeFiles(repoPath: string) {
  const [files, setFiles] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    void listDocs(repoPath)
      .then((nodes) => {
        if (!cancelled)
          setFiles(nodes.filter((n) => !n.isDir && n.name === 'CLAUDE.md').map((n) => n.path));
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

const scopeOf = (rel: string) => {
  const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  return dir === '' || dir === '.claude' ? 'project' : `${dir}/`;
};

export function ClaudeSection({
  repo,
  claude,
  onToggleMcp,
  onTogglePlugin,
}: {
  repo: Repo;
  claude: ClaudeStatus | null;
  onToggleMcp: (name: string, enabled: boolean) => void;
  onTogglePlugin: (key: string, enabled: boolean) => void;
}) {
  const files = useClaudeFiles(repo.path);

  return (
    <div className="section-scroll">
      <div className="section-inner detail-stack">
        <section className="claude-files-section">
          <div className="detail-section-head">
            <h2 className="section-title">
              CLAUDE.md in this repo
              <span className="count-pill">{files.length} files</span>
            </h2>
          </div>
          <div className="card">
            {files.length === 0 ? (
              <div className="card-pad muted-row">No CLAUDE.md files found in this repo.</div>
            ) : (
              files.map((f, i) => (
                <div className={i === files.length - 1 ? 'mcp-row last-row' : 'mcp-row'} key={f}>
                  <div className="mcp-info">
                    <Icon name="file" size={18} color={colors.textSubtle} strokeWidth={1.6} />
                    <div style={{ minWidth: 0 }}>
                      <div className="file-path">
                        {f}
                        <span className="claude-file-scope">{scopeOf(f)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="claude-columns">
          <section className="claude-col">
            <div className="detail-section-head">
              <h2 className="section-title">
                MCP servers
                <span className="count-pill">{claude ? mcpMeta(claude.mcp) : '—'}</span>
              </h2>
            </div>
            <div className="card">
              {!claude || claude.mcp.length === 0 ? (
                <div className="card-pad muted-row">No MCP servers configured</div>
              ) : (
                claude.mcp.map((m, i) => (
                  <div
                    className={i === claude.mcp.length - 1 ? 'mcp-row last-row' : 'mcp-row'}
                    key={m.name}
                  >
                    <div className="mcp-info">
                      <span
                        className="dot"
                        style={{ width: 7, height: 7, background: dotColor(m.enabled) }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div className="mcp-name">{m.name}</div>
                        <div className="mcp-desc">{m.command || 'mcp server'}</div>
                      </div>
                    </div>
                    <button
                      className={m.enabled ? 'toggle on' : 'toggle'}
                      title={`Toggle ${m.name}`}
                      onClick={() => onToggleMcp(m.name, !m.enabled)}
                    >
                      <span className="knob" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="claude-col">
            <div className="detail-section-head">
              <h2 className="section-title">
                Plugins
                <span className="count-pill">{claude ? pluginMeta(claude.plugins) : '—'}</span>
              </h2>
            </div>
            <div className="card plugin-pad">
              {!claude || claude.plugins.length === 0 ? (
                <div className="muted-row">No plugins installed</div>
              ) : (
                claude.plugins.map((p, i) => (
                  <div
                    className={i === claude.plugins.length - 1 ? 'plugin-row last' : 'plugin-row'}
                    key={p.key}
                  >
                    <span className="plugin-icon">
                      <Icon name="gridSmall" size={15} strokeWidth={1.7} />
                    </span>
                    <div className="plugin-meta">
                      <div className="plugin-name">{p.name}</div>
                      <div className="plugin-desc">{p.marketplace || p.scope}</div>
                    </div>
                    <button
                      className={p.enabled ? 'toggle on' : 'toggle'}
                      title={`Toggle ${p.name}`}
                      onClick={() => onTogglePlugin(p.key, !p.enabled)}
                    >
                      <span className="knob" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
