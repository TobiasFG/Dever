import { ReactNode } from 'react';
import { Icon, IconName } from '@/components/Icon';
import { McpServer } from '@/data/dashboard';

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

function SystemPromptCard() {
  return (
    <Card title="System prompt" meta="global">
      <div className="card-pad">
        <div className="file-row">
          <div className="file-info">
            <Icon name="file" size={18} color="var(--text-subtle)" strokeWidth={1.6} />
            <div style={{ minWidth: 0 }}>
              <div className="file-path">~/.claude/CLAUDE.md</div>
              <div className="file-sub">42 lines · edited 3 days ago</div>
            </div>
          </div>
          <button className="btn-primary">Edit</button>
        </div>
      </div>
    </Card>
  );
}

function McpCard({
  mcp,
  activeMcp,
  onToggle,
}: {
  mcp: McpServer[];
  activeMcp: number;
  onToggle: (id: string) => void;
}) {
  return (
    <Card title="MCP servers" meta={`${activeMcp} of ${mcp.length} active`}>
      <div>
        {mcp.map((server) => (
          <div className="mcp-row" key={server.id}>
            <div className="mcp-info">
              <span
                className="dot"
                style={{
                  width: 7,
                  height: 7,
                  background: server.on ? 'var(--green)' : 'var(--text-faint)',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div className="mcp-name">{server.name}</div>
                <div className="mcp-desc">{server.desc}</div>
              </div>
            </div>
            <button
              className={server.on ? 'toggle on' : 'toggle'}
              title={`Toggle ${server.name}`}
              onClick={() => onToggle(server.id)}
            >
              <span className="knob" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PluginRow({
  icon,
  name,
  desc,
  last,
}: {
  icon: IconName;
  name: string;
  desc: string;
  last?: boolean;
}) {
  return (
    <div className={last ? 'plugin-row last' : 'plugin-row'}>
      <span className="plugin-icon">
        <Icon name={icon} size={15} strokeWidth={1.7} />
      </span>
      <div className="plugin-meta">
        <div className="plugin-name">{name}</div>
        <div className="plugin-desc">{desc}</div>
      </div>
      <span className="badge-on">On</span>
    </div>
  );
}

function QuickButton({ icon, label }: { icon: IconName; label: string }) {
  return (
    <button className="quick-btn">
      <Icon name={icon} size={16} color="var(--accent)" strokeWidth={1.8} />
      {label}
    </button>
  );
}

export function ClaudePanel({
  mcp,
  activeMcp,
  onToggleMcp,
}: {
  mcp: McpServer[];
  activeMcp: number;
  onToggleMcp: (id: string) => void;
}) {
  return (
    <aside className="panel">
      <div className="section-head">
        <h2 className="section-title">Claude Code</h2>
        <span className="status-light">
          <span className="dot" style={{ width: 7, height: 7, background: 'var(--green)' }} />
          detected
        </span>
      </div>

      <div className="panel-body">
        <SystemPromptCard />
        <McpCard mcp={mcp} activeMcp={activeMcp} onToggle={onToggleMcp} />

        <Card title="Plugins" meta="2 enabled">
          <div className="plugin-pad">
            <PluginRow icon="gridSmall" name="prettier-format" desc="runs on save" />
            <PluginRow icon="atom" name="git-conventional" desc="commit linting" last />
          </div>
        </Card>

        <div className="quick">
          <div className="quick-title">Quick actions</div>
          <div className="quick-list">
            <QuickButton icon="rescan" label="Scan for new repositories" />
            <QuickButton icon="terminal" label="New terminal session" />
            <QuickButton icon="file" label="Edit global CLAUDE.md" />
          </div>
        </div>
      </div>
    </aside>
  );
}
