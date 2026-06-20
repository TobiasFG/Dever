import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Menu, MenuItem } from '@/components/Menu';
import { Popover } from '@/components/Popover';
import { openInEditor, openTerminal, revealInFileManager } from '../api';
import type { RepoView } from '../derive';
import type { Editor } from '../types';
import { BranchCombobox, BranchPanel } from './BranchCombobox';

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

/** Card dropdown listing the editors detected on this machine. */
function EditorMenu({ repo, editors }: { repo: RepoView; editors: Editor[] }) {
  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button
          type="button"
          className="icon-btn"
          title="Open in editor"
          aria-expanded={open}
          onClick={toggle}
        >
          <Icon name="editor" size={14} strokeWidth={1.8} />
        </button>
      )}
    >
      {(close) =>
        editors.length === 0 ? (
          <div className="menu">
            <div className="menu-empty">No editors found</div>
          </div>
        ) : (
          <Menu
            close={close}
            items={editors.map((e) => ({
              icon: 'editor',
              label: e.name,
              onSelect: () => void openInEditor(repo.path, e.id),
            }))}
          />
        )
      }
    </Popover>
  );
}

/** "More actions" dropdown — every action, with icon + text. Selecting Switch
 * branch swaps the panel to the branch combobox in place. */
function MoreActionsPanel({
  repo,
  editors,
  close,
  onSwitched,
}: {
  repo: RepoView;
  editors: Editor[];
  close: () => void;
  onSwitched: () => void;
}) {
  const [view, setView] = useState<'menu' | 'branch'>('menu');
  if (view === 'branch') {
    return <BranchPanel repo={repo} close={close} onSwitched={onSwitched} />;
  }
  const items: MenuItem[] = [
    { icon: 'open', label: 'Open', onSelect: () => {} },
    {
      icon: 'swap',
      label: 'Switch branch',
      disabled: repo.changes > 0,
      keepOpen: true,
      onSelect: () => setView('branch'),
    },
    { icon: 'terminal', label: 'Start terminal', onSelect: () => void openTerminal(repo.path) },
    ...editors.map<MenuItem>((e) => ({
      icon: 'editor',
      label: `Open in ${e.name}`,
      onSelect: () => void openInEditor(repo.path, e.id),
    })),
    {
      icon: 'file',
      label: 'Reveal in Finder',
      onSelect: () => void revealInFileManager(repo.path),
    },
    {
      icon: 'docs',
      label: 'Copy path',
      onSelect: () => void navigator.clipboard.writeText(repo.path),
    },
  ];
  return <Menu items={items} close={close} />;
}

function RepoRow({
  repo,
  editors,
  onSwitched,
}: {
  repo: RepoView;
  editors: Editor[];
  onSwitched: () => void;
}) {
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
        <button className="icon-btn" title="Open">
          <Icon name="open" size={14} strokeWidth={1.8} />
        </button>
        <BranchCombobox repo={repo} onSwitched={onSwitched} />
        <button
          type="button"
          className="icon-btn"
          title="Start terminal"
          onClick={() => void openTerminal(repo.path)}
        >
          <Icon name="terminal" size={14} strokeWidth={1.8} />
        </button>
        <EditorMenu repo={repo} editors={editors} />
        <Popover
          trigger={({ open, toggle }) => (
            <button
              type="button"
              className="icon-btn"
              title="More actions"
              aria-expanded={open}
              onClick={toggle}
            >
              <Icon name="more" size={14} strokeWidth={1.8} />
            </button>
          )}
        >
          {(close) => (
            <MoreActionsPanel repo={repo} editors={editors} close={close} onSwitched={onSwitched} />
          )}
        </Popover>
      </div>
    </div>
  );
}

export function RepoList({
  repos,
  editors,
  query,
  loading,
  onAddRoot,
  onRescan,
}: {
  repos: RepoView[];
  editors: Editor[];
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
            <RepoRow key={repo.path} repo={repo} editors={editors} onSwitched={onRescan} />
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
