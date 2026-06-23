import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Menu, MenuItem } from '@/components/Menu';
import { Popover } from '@/components/Popover';
import { openInEditor, openTerminal, revealInFileManager } from '../api';
import type { RepoView } from '../derive';
import type { Editor } from '../types';
import type { PullAllResult } from '../useRepos';
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

/** Fast-forward pull button — shown only when the repo is a safe ff candidate. */
function PullButton({ repo, onPull }: { repo: RepoView; onPull: (path: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="icon-btn pull-btn"
      title={`Pull ${repo.behind} commit${repo.behind === 1 ? '' : 's'} (fast-forward)`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onPull(repo.path);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Icon name="download" size={14} strokeWidth={1.8} />
    </button>
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

type DragState = {
  draggable: boolean;
  dragging: boolean;
  dropEdge: 'before' | 'after' | null;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

function RepoRow({
  repo,
  editors,
  onSwitched,
  onPull,
  onOpen,
  drag,
}: {
  repo: RepoView;
  editors: Editor[];
  onSwitched: () => void;
  onPull: (path: string) => Promise<void>;
  onOpen: (path: string) => void;
  drag: DragState;
}) {
  const className = [
    'repo-row',
    drag.dragging ? 'dragging' : '',
    drag.dropEdge ? `drop-${drag.dropEdge}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      title="Open repository"
      draggable={drag.draggable}
      onClick={() => onOpen(repo.path)}
      onDragStart={drag.onDragStart}
      onDragOver={drag.onDragOver}
      onDrop={drag.onDrop}
      onDragEnd={drag.onDragEnd}
    >
      {drag.draggable && (
        <span
          className="drag-handle"
          title="Drag to reorder"
          aria-hidden
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="grip" size={14} strokeWidth={1.8} />
        </span>
      )}
      <span className="dot" style={{ background: repo.dotColor }} />
      <span className="repo-name">{repo.name}</span>
      <span className="repo-path">{repo.path}</span>

      <span className="branch" title={repo.branch}>
        <Icon name="branch" size={12} color="var(--text-muted)" strokeWidth={1.8} />
        <span>{repo.branch}</span>
      </span>

      <StatusBadge repo={repo} />

      <div className="spacer" />

      <div className="repo-actions" onClick={(e) => e.stopPropagation()}>
        {repo.canPull && <PullButton repo={repo} onPull={onPull} />}
        <button className="icon-btn" title="Open" onClick={() => onOpen(repo.path)}>
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

/** Dropdown listing the scanned root folders, each removable. */
function ManageFoldersPanel({
  roots,
  onAddRoot,
  onRemoveRoot,
}: {
  roots: string[];
  onAddRoot: () => void;
  onRemoveRoot: (path: string) => void;
}) {
  return (
    <div className="menu folders-menu">
      <div className="menu-section">Scanned folders</div>
      {roots.length === 0 ? (
        <div className="menu-empty">No folders added yet.</div>
      ) : (
        roots.map((root) => (
          <div className="folder-row" key={root}>
            <span className="folder-path" title={root}>
              {root}
            </span>
            <button
              type="button"
              className="icon-btn"
              title="Stop scanning this folder"
              onClick={() => onRemoveRoot(root)}
            >
              <Icon name="close" size={13} strokeWidth={2} />
            </button>
          </div>
        ))
      )}
      <button type="button" className="menu-item" onClick={onAddRoot}>
        <Icon name="plus" size={14} strokeWidth={1.8} />
        Add folder…
      </button>
    </div>
  );
}

export function RepoList({
  repos,
  editors,
  query,
  loading,
  roots,
  onAddRoot,
  onRescan,
  onRemoveRoot,
  onReorder,
  onPull,
  onPullAll,
  onOpen,
}: {
  repos: RepoView[];
  editors: Editor[];
  query: string;
  loading: boolean;
  roots: string[];
  onAddRoot: () => void;
  onRescan: () => void;
  onRemoveRoot: (path: string) => void;
  onReorder: (orderedPaths: string[]) => void;
  onPull: (path: string) => Promise<void>;
  onPullAll: (paths: string[]) => Promise<PullAllResult>;
  onOpen: (path: string) => void;
}) {
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ path: string; below: boolean } | null>(null);
  const [bulkPulling, setBulkPulling] = useState(false);

  // Reordering only makes sense over the full, unfiltered list.
  const dndEnabled = query.trim() === '';
  const pullable = repos.filter((r) => r.canPull).map((r) => r.path);

  const resetDrag = () => {
    setDragPath(null);
    setDropTarget(null);
  };

  const commitDrop = () => {
    if (!dragPath || !dropTarget) return resetDrag();
    const paths = repos.map((r) => r.path);
    const from = paths.indexOf(dragPath);
    if (from < 0) return resetDrag();
    paths.splice(from, 1);
    let insert = paths.indexOf(dropTarget.path);
    if (insert < 0) return resetDrag();
    if (dropTarget.below) insert += 1;
    paths.splice(insert, 0, dragPath);
    onReorder(paths);
    resetDrag();
  };

  const dragFor = (repo: RepoView): DragState => {
    const dropEdge: 'before' | 'after' | null =
      dropTarget?.path === repo.path && dragPath && dragPath !== repo.path
        ? dropTarget.below
          ? 'after'
          : 'before'
        : null;
    return {
      draggable: dndEnabled,
      dragging: dragPath === repo.path,
      dropEdge,
      onDragStart: (e) => {
        // Without an allowed effect + payload, WebView2/WebKitGTK reject every
        // drop target (the "not allowed" cursor) and never fire dragover state.
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', repo.path);
        setDragPath(repo.path);
      },
      onDragOver: (e) => {
        if (!dragPath || dragPath === repo.path) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const below = e.clientY - rect.top > rect.height / 2;
        setDropTarget((prev) =>
          prev?.path === repo.path && prev.below === below ? prev : { path: repo.path, below },
        );
      },
      onDrop: (e) => {
        e.preventDefault();
        commitDrop();
      },
      onDragEnd: resetDrag,
    };
  };

  const pullAllEligible = async () => {
    setBulkPulling(true);
    try {
      await onPullAll(pullable);
    } finally {
      setBulkPulling(false);
    }
  };

  return (
    <section className="repos">
      <div className="section-head">
        <h2 className="section-title">
          Repositories
          <span className="count-pill">{repos.length}</span>
        </h2>
        <div className="filter-row">
          {pullable.length > 0 && (
            <button
              className="btn-secondary"
              onClick={pullAllEligible}
              disabled={loading || bulkPulling}
            >
              <Icon name="download" size={14} strokeWidth={1.8} />
              {bulkPulling ? 'Pulling…' : `Pull ${pullable.length} behind`}
            </button>
          )}
          <Popover
            trigger={({ open, toggle }) => (
              <button
                className="btn-secondary"
                aria-expanded={open}
                onClick={toggle}
                disabled={loading}
              >
                <Icon name="file" size={14} strokeWidth={1.8} />
                Manage folders
              </button>
            )}
          >
            {() => (
              <ManageFoldersPanel roots={roots} onAddRoot={onAddRoot} onRemoveRoot={onRemoveRoot} />
            )}
          </Popover>
          <button className="btn-secondary" onClick={onRescan} disabled={loading}>
            <Icon name="rescan" size={14} strokeWidth={1.8} />
            {loading ? 'Scanning…' : 'Rescan'}
          </button>
        </div>
      </div>

      {repos.length > 0 ? (
        <div className="repo-list">
          {repos.map((repo) => (
            <RepoRow
              key={repo.path}
              repo={repo}
              editors={editors}
              onSwitched={onRescan}
              onPull={onPull}
              onOpen={onOpen}
              drag={dragFor(repo)}
            />
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
