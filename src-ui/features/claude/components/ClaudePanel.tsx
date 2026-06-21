import { ReactNode, useState } from 'react';
import { Icon } from '@/components/Icon';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { readGlobalClaudeMd } from '../api';
import { dotColor, mcpMeta, pluginMeta, statusDotColor, systemPromptMeta } from '../derive';
import type { ClaudeStatus } from '../types';

const INSTALL_URL = 'https://www.claude.com/product/claude-code';

function Card({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="title">{title}</span>
        <span className="meta">{meta}</span>
      </div>
      {children}
    </div>
  );
}

function SystemPromptCard({
  status,
  onOpenEditor,
}: {
  status: ClaudeStatus;
  onOpenEditor: () => void;
}) {
  const sp = status.systemPrompt;
  return (
    <Card title="CLAUDE.md" meta={systemPromptMeta(sp)}>
      <div className="card-pad">
        {sp.exists ? (
          <div className="file-row">
            <div className="file-info">
              <Icon name="file" size={18} color="var(--text-subtle)" strokeWidth={1.6} />
              <div style={{ minWidth: 0 }}>
                <div className="file-path">{sp.path}</div>
                <div className="file-sub">
                  {sp.lines} {sp.lines === 1 ? 'line' : 'lines'} · global
                </div>
              </div>
            </div>
            <button className="btn-primary" onClick={onOpenEditor}>
              Edit
            </button>
          </div>
        ) : (
          <div className="file-row missing">
            <div className="file-info">
              <Icon name="file" size={18} color="var(--text-faint)" strokeWidth={1.6} />
              <div style={{ minWidth: 0 }}>
                <div className="file-missing-title">No system prompt yet</div>
                <div className="file-path">{sp.path}</div>
              </div>
            </div>
            <button className="btn-primary btn-icon" onClick={onOpenEditor}>
              <Icon name="plus" size={14} strokeWidth={2.2} />
              Create
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function McpCard({
  status,
  onToggle,
}: {
  status: ClaudeStatus;
  onToggle: (name: string, enabled: boolean) => void;
}) {
  return (
    <Card title="MCP servers" meta={mcpMeta(status.mcp)}>
      <div>
        {status.mcp.length === 0 ? (
          <div className="card-pad muted-row">No MCP servers configured</div>
        ) : (
          status.mcp.map((server) => (
            <div className="mcp-row" key={server.name}>
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
                title={`Toggle ${server.name}`}
                onClick={() => onToggle(server.name, !server.enabled)}
              >
                <span className="knob" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function PluginsCard({
  status,
  onToggle,
}: {
  status: ClaudeStatus;
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <Card title="Plugins" meta={pluginMeta(status.plugins)}>
      <div className="plugin-pad">
        {status.plugins.length === 0 ? (
          <div className="muted-row">No plugins installed</div>
        ) : (
          status.plugins.map((plugin, i) => (
            <div
              className={i === status.plugins.length - 1 ? 'plugin-row last' : 'plugin-row'}
              key={plugin.key}
            >
              <span className="plugin-icon">
                <Icon name="gridSmall" size={15} strokeWidth={1.7} />
              </span>
              <div className="plugin-meta">
                <div className="plugin-name">{plugin.name}</div>
                <div className="plugin-desc">{plugin.marketplace || plugin.scope}</div>
              </div>
              <button
                className={plugin.enabled ? 'toggle on' : 'toggle'}
                title={`Toggle ${plugin.name}`}
                onClick={() => onToggle(plugin.key, !plugin.enabled)}
              >
                <span className="knob" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function NotDetected() {
  return (
    <div className="claude-empty">
      <span className="claude-empty-icon">
        <Icon name="terminal" size={22} strokeWidth={1.6} />
      </span>
      <div className="claude-empty-title">Claude Code not detected</div>
      <div className="claude-empty-text">
        We couldn&apos;t find a Claude Code installation on this machine. Install it to manage your
        system prompt, MCP servers, and plugins from here.
      </div>
      <a className="btn-primary btn-icon" href={INSTALL_URL} target="_blank" rel="noreferrer">
        <Icon name="download" size={15} strokeWidth={1.9} />
        Get Claude Code
      </a>
    </div>
  );
}

export function ClaudePanel({
  status,
  onToggleMcp,
  onTogglePlugin,
  onSaveSystemPrompt,
}: {
  status: ClaudeStatus | null;
  onToggleMcp: (name: string, enabled: boolean) => void;
  onTogglePlugin: (key: string, enabled: boolean) => void;
  onSaveSystemPrompt: (content: string) => Promise<void>;
}) {
  const [editorContent, setEditorContent] = useState<string | null>(null);

  const openEditor = async () => setEditorContent(await readGlobalClaudeMd());

  const detected = status?.detected ?? false;

  return (
    <aside className="panel">
      <div className="section-head">
        <h2 className="section-title">
          Claude Code
          <span className="panel-tag">system settings</span>
        </h2>
        <span className="status-light">
          <span
            className="dot"
            style={{ width: 7, height: 7, background: statusDotColor(detected) }}
          />
          {detected ? 'detected' : 'not detected'}
        </span>
      </div>

      {status &&
        (detected ? (
          <div className="panel-body">
            <SystemPromptCard status={status} onOpenEditor={openEditor} />
            <McpCard status={status} onToggle={onToggleMcp} />
            <PluginsCard status={status} onToggle={onTogglePlugin} />
          </div>
        ) : (
          <NotDetected />
        ))}

      {editorContent !== null && (
        <MarkdownEditor
          title="Global CLAUDE.md"
          filePathLabel="~/.claude/CLAUDE.md"
          initialContent={editorContent}
          onSave={onSaveSystemPrompt}
          onClose={() => setEditorContent(null)}
        />
      )}
    </aside>
  );
}
