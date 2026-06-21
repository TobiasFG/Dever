import { ReactNode } from 'react';

function StatCard({
  label,
  value,
  valueColor,
  suffix,
  sub,
}: {
  label: string;
  value: ReactNode;
  valueColor?: string;
  suffix?: ReactNode;
  sub: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
        {suffix}
      </div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

export function StatCards({
  repoCount,
  dirtyCount,
  behindCount,
  detected,
  activeMcp,
  mcpTotal,
}: {
  repoCount: number;
  dirtyCount: number;
  behindCount: number;
  detected: boolean;
  activeMcp: number;
  mcpTotal: number;
}) {
  return (
    <div className="stat-grid">
      <StatCard label="Repositories" value={repoCount} sub="discovered by scanning" />
      <StatCard
        label="Uncommitted"
        value={dirtyCount}
        valueColor="var(--yellow)"
        sub="repos with local changes"
      />
      <StatCard
        label="Behind remote"
        value={behindCount}
        valueColor="var(--red)"
        sub="need a pull"
      />
      <StatCard
        label="MCP servers"
        value={detected ? activeMcp : '—'}
        valueColor={detected ? 'var(--green)' : 'var(--text-faint)'}
        suffix={detected ? <span className="suffix">/{mcpTotal}</span> : undefined}
        sub={detected ? 'active globally' : 'Claude Code offline'}
      />
    </div>
  );
}
