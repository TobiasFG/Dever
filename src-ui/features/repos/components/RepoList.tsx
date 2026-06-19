import { Icon } from '@/components/Icon';
import type { RepoView } from '../derive';

function StatusBadge({ repo }: { repo: RepoView }) {
  return (
    <div className="status">
      {repo.clean && (
        <span
          className="status-item"
          style={{ color: 'var(--green)' }}
          title="Clean and up to date"
        >
          <Icon name="check" size={13} strokeWidth={2.4} />
          clean
        </span>
      )}
      {repo.showAhead && (
        <span
          className="status-item tight"
          style={{ color: 'var(--text-subtle)' }}
          title="Commits ahead of remote"
        >
          <Icon name="chevronUp" size={12} strokeWidth={2.6} />
          {repo.ahead}
        </span>
      )}
      {repo.showBehind && (
        <span
          className="status-item tight"
          style={{ color: 'var(--text-subtle)' }}
          title="Commits behind remote"
        >
          <Icon name="chevronDown" size={12} strokeWidth={2.6} />
          {repo.behind}
        </span>
      )}
      {repo.showChanges && (
        <span
          className="status-item"
          style={{ color: 'var(--yellow)' }}
          title="Uncommitted changes"
        >
          <span className="changes-square" />
          {repo.changes}
        </span>
      )}
      {repo.showConflict && (
        <span className="status-item" style={{ color: 'var(--red)' }} title="Merge conflict">
          <Icon name="conflict" size={13} strokeWidth={2} />
          conflict
        </span>
      )}
    </div>
  );
}

function RepoRow({ repo }: { repo: RepoView }) {
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

export function RepoList({
  repos,
  query,
  loading,
  onAddRoot,
  onRescan,
}: {
  repos: RepoView[];
  query: string;
  loading: boolean;
  onAddRoot: () => void;
  onRescan: () => void;
}) {
  return (
    <section className="repos">
      <div className="section-head">
        <h2 className="section-title">
          Repositories
          <span className="count-pill">{repos.length}</span>
        </h2>
        <div className="filter-row">
          <button className="btn-secondary" onClick={onAddRoot} disabled={loading}>
            <Icon name="file" size={14} strokeWidth={1.8} />
            Add folder
          </button>
          <button className="btn-secondary" onClick={onRescan} disabled={loading}>
            <Icon name="rescan" size={14} strokeWidth={1.8} />
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
        </div>
      </div>

      {repos.length > 0 ? (
        <div className="repo-list">
          {repos.map((repo) => (
            <RepoRow key={repo.path} repo={repo} />
          ))}
        </div>
      ) : (
        <div className="empty">
          {query
            ? `No repositories match “${query}”.`
            : 'No repositories yet — add a folder to scan.'}
        </div>
      )}
    </section>
  );
}
