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
  activeMcp,
  mcpTotal,
}: {
  repoCount: number;
  dirtyCount: number;
  behindCount: number;
  activeMcp: number;
  mcpTotal: number;
}) {
  return (
    <div className="stat-grid">
      <StatCard label="Repositories" value={repoCount} sub="across 3 root folders" />
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
        value={activeMcp}
        valueColor="var(--green)"
        suffix={<span className="suffix">/{mcpTotal}</span>}
        sub="active globally"
      />
    </div>
  );
}
