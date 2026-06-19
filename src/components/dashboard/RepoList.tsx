import { Icon } from '@/components/Icon';
import { DerivedRepo } from '@/data/dashboard';

function StatusBadge({ repo }: { repo: DerivedRepo }) {
  return (
    <div className="status">
      {repo.clean && (
        <span className="status-item" style={{ color: 'var(--green)' }} title="Clean and up to date">
          <Icon name="check" size={13} strokeWidth={2.4} />
          clean
        </span>
      )}
      {repo.showAhead && (
        <span className="status-item tight" style={{ color: 'var(--text-subtle)' }} title="Commits ahead of remote">
          <Icon name="chevronUp" size={12} strokeWidth={2.6} />
          {repo.ahead}
        </span>
      )}
      {repo.showBehind && (
        <span className="status-item tight" style={{ color: 'var(--text-subtle)' }} title="Commits behind remote">
          <Icon name="chevronDown" size={12} strokeWidth={2.6} />
          {repo.behind}
        </span>
      )}
      {repo.showChanges && (
        <span className="status-item" style={{ color: 'var(--yellow)' }} title="Uncommitted changes">
          <span className="changes-square" />
          {repo.changesText}
        </span>
      )}
      {repo.showConflict && (
        <span className="status-item" style={{ color: 'var(--red)' }} title="Merge conflict with main">
          <Icon name="conflict" size={13} strokeWidth={2} />
          conflict
        </span>
      )}
    </div>
  );
}

function RepoRow({ repo }: { repo: DerivedRepo }) {
  return (
    <div className="repo-row">
      <span className="dot" style={{ background: repo.dotColor }} />
      <span className="repo-name">{repo.name}</span>
      <span className="repo-path">{repo.path}</span>

      <span className="branch" title={repo.branch}>
        <Icon name="branch" size={12} color="var(--text-muted)" strokeWidth={1.8} />
        <span>{repo.branch}</span>
      </span>

      <StatusBadge repo={repo} />

      <div className="spacer" />

      <div className="features">
        {repo.features.map((f) => (
          <span key={f} className="feature-tag">
            {f}
          </span>
        ))}
      </div>

      <div className="repo-actions">
        <button className="icon-btn" title="Open in editor">
          <Icon name="editor" size={14} strokeWidth={1.8} />
        </button>
        <button className="icon-btn" title="Open terminal">
          <Icon name="terminal" size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

export function RepoList({ repos, query }: { repos: DerivedRepo[]; query: string }) {
  return (
    <section className="repos">
      <div className="section-head">
        <h2 className="section-title">
          Repositories
          <span className="count-pill">{repos.length}</span>
        </h2>
        <div className="filter-row">
          <span className="chip active">All</span>
          <span className="chip">Uncommitted</span>
          <span className="chip">Behind</span>
        </div>
      </div>

      {repos.length > 0 ? (
        <div className="repo-list">
          {repos.map((repo) => (
            <RepoRow key={repo.name} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="empty">No repositories match “{query}”.</div>
      )}
    </section>
  );
}
