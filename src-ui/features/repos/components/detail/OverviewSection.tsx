import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import type { ClaudeStatus } from '@/features/claude/types';
import type { RepoDetailView } from '../../derive';
import { useBranches } from '../../useBranches';
import type { Repo } from '../../types';
import { AskCard } from './AskCard';

export function OverviewSection({
  repo,
  detail,
  claude,
  onPull,
  onViewBranches,
}: {
  repo: Repo;
  detail: RepoDetailView;
  claude: ClaudeStatus | null;
  onPull: (path: string) => Promise<void>;
  onViewBranches: () => void;
}) {
  const { branches } = useBranches(repo.path);
  const [pulling, setPulling] = useState(false);
  const local = branches.filter((b) => !b.isRemote).slice(0, 4);

  return (
    <div className="section-scroll">
      <div className="section-inner detail-stack">
        {/* git status card */}
        <div className="card">
          <div className="card-head">
            <span className="title">Git status</span>
            {detail.canPull && (
              <button
                className="btn-primary btn-icon"
                title="Pull (fast-forward only)"
                disabled={pulling}
                onClick={async () => {
                  setPulling(true);
                  try {
                    await onPull(repo.path);
                  } finally {
                    setPulling(false);
                  }
                }}
              >
                <Icon name="download" size={14} strokeWidth={1.9} />
                {pulling ? 'Pulling…' : `Pull ${detail.behind} behind`}
              </button>
            )}
          </div>
          <div className="status-grid">
            <div className="status-field">
              <span className="status-field-label">Branch</span>
              <span className="branch">
                <Icon name="branch" size={12} strokeWidth={1.8} color={colors.textMuted} />
                <span>{detail.branch}</span>
              </span>
            </div>
            <div className="status-field">
              <span className="status-field-label">Upstream</span>
              <span className="status-field-mono">{detail.upstreamText}</span>
            </div>
            <div className="status-field">
              <span className="status-field-label">Ahead</span>
              <span className="status-field-value" style={{ color: detail.aheadColor }}>
                <Icon name="chevronUp" size={13} strokeWidth={2.4} />
                {detail.ahead}
              </span>
            </div>
            <div className="status-field">
              <span className="status-field-label">Behind</span>
              <span className="status-field-value" style={{ color: detail.behindColor }}>
                <Icon name="chevronDown" size={13} strokeWidth={2.4} />
                {detail.behind}
              </span>
            </div>
            <div className="status-field">
              <span className="status-field-label">Uncommitted</span>
              <span className="status-field-value" style={{ color: detail.changesColor }}>
                {detail.changesValue}
              </span>
            </div>
            {detail.hasConflict && (
              <div className="status-field">
                <span className="status-field-label">Conflict</span>
                <span className="status-field-value" style={{ color: colors.red }}>
                  <Icon name="conflict" size={14} strokeWidth={2} />
                  merge conflict
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ask claude about this repo */}
        <AskCard repo={repo} detected={claude?.detected ?? false} />

        {/* recently updated branches */}
        {local.length > 0 && (
          <section>
            <div className="detail-section-head">
              <h2 className="section-title">Branches</h2>
              <button className="link-btn" onClick={onViewBranches}>
                View all
                <Icon name="chevronRight" size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="branch-cards">
              {local.map((b) => (
                <div key={b.name} className="branch-card">
                  <div className="branch-card-head">
                    <span
                      className="dot"
                      style={{ background: b.isCurrent ? colors.green : colors.accent }}
                    />
                    <div className="branch-card-name-wrap">
                      <div className="branch-card-name">{b.name}</div>
                      <div className="branch-card-sub">{b.isCurrent ? 'checked out' : 'local'}</div>
                    </div>
                    {b.isCurrent && <span className="branch-card-current">current</span>}
                  </div>
                  <div className="branch-card-foot">
                    <div className="branch-card-meta">
                      <div className="branch-card-meta-label">upstream</div>
                      <div className="branch-card-meta-value">{b.upstream ?? 'none'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
