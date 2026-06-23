import { useMemo } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { timeAgo } from '@/lib/time';
import { useDocs } from '../useDocs';
import type { DocNode, DocStatus } from '../types';
import { Markdown } from './Markdown';

const dotColor = (s: DocStatus) => (s === 'new' ? colors.green : colors.yellow);

/** The repo's Documentation section: a file tree on the left and a rendered
 * markdown viewer on the right, with change tracking since last viewed. */
export function DocsViewer({
  repoPath,
  onOpen,
}: {
  repoPath: string;
  onOpen?: (rel: string) => void;
}) {
  const {
    tree,
    loading,
    selected,
    doc,
    docLoading,
    docStatus,
    selectDoc,
    statusOf,
    markAllRead,
    changedCount,
    recent,
    fileCount,
  } = useDocs(repoPath);

  const docPaths = useMemo(() => new Set(tree.filter((n) => !n.isDir).map((n) => n.path)), [tree]);
  const crumbs = (selected ?? '').split('/');
  const curStatus = doc ? docStatus : 'unchanged';

  return (
    <div className="docs">
      {/* tree sidebar */}
      <div className="docs-tree">
        <div className="docs-tree-head">
          <span className="docs-tree-title">Documentation</span>
          <span className="docs-tree-count">{fileCount} files</span>
        </div>
        {changedCount > 0 && (
          <div className="docs-changed-bar">
            <span className="docs-changed-label">
              <span className="docs-changed-dots">
                <span className="dot" style={{ background: colors.green }} />
                <span className="dot" style={{ background: colors.yellow }} />
              </span>
              {changedCount} changed since last visit
            </span>
            <button className="link-btn" title="Mark all docs as read" onClick={markAllRead}>
              Mark all read
            </button>
          </div>
        )}
        <div className="docs-tree-scroll">
          {loading && <div className="docs-empty">Scanning…</div>}
          {!loading && tree.length === 0 && (
            <div className="docs-empty">No markdown files found.</div>
          )}
          {tree.map((node) =>
            node.isDir ? (
              <DirRow key={`d:${node.path}`} node={node} />
            ) : (
              <FileRow
                key={node.path}
                node={node}
                active={node.path === selected}
                status={statusOf(node)}
                onClick={() => selectDoc(node.path)}
              />
            ),
          )}

          {recent.length > 0 && (
            <div className="docs-recent">
              <div className="docs-recent-title">Recently changed</div>
              {recent.map((node) => (
                <button
                  key={node.path}
                  className="docs-recent-row"
                  onClick={() => selectDoc(node.path)}
                >
                  <span className="docs-recent-name">
                    {statusOf(node) !== 'unchanged' && (
                      <span className="dot" style={{ background: dotColor(statusOf(node)) }} />
                    )}
                    {node.name}
                  </span>
                  <span className="docs-recent-time">{timeAgo(node.modified)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* viewer */}
      <div className="docs-view">
        <div className="docs-view-head">
          <div className="docs-crumbs">
            {crumbs.map((c, i) => (
              <span key={i} className="docs-crumb-group">
                <span className={i === crumbs.length - 1 ? 'docs-crumb last' : 'docs-crumb'}>
                  {c}
                </span>
                {i < crumbs.length - 1 && <span className="docs-crumb-sep">/</span>}
              </span>
            ))}
          </div>
          <div className="docs-view-actions">
            {doc && <span className="docs-modified">updated {timeAgo(doc.modified)}</span>}
            {onOpen && selected && (
              <button className="btn-mini" title="Open in editor" onClick={() => onOpen(selected)}>
                <Icon name="editor" size={13} strokeWidth={1.8} />
                Open
              </button>
            )}
          </div>
        </div>
        <div className="docs-view-scroll">
          <div className="docs-view-inner">
            {curStatus !== 'unchanged' && (
              <div className={curStatus === 'new' ? 'doc-banner new' : 'doc-banner updated'}>
                <span className="dot" style={{ background: dotColor(curStatus) }} />
                <span className="doc-banner-label">
                  {curStatus === 'new' ? 'New file' : 'Updated'}
                </span>
                <span className="doc-banner-text">
                  {curStatus === 'new'
                    ? 'Created since you last opened this repo.'
                    : 'Changed since you last viewed this file.'}
                </span>
              </div>
            )}
            {docLoading && !doc ? (
              <div className="docs-empty">Loading…</div>
            ) : doc ? (
              <Markdown
                content={doc.content}
                path={doc.path}
                docPaths={docPaths}
                onNavigate={selectDoc}
              />
            ) : (
              <div className="docs-empty">Select a document to read.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DirRow({ node }: { node: DocNode }) {
  return (
    <div className="docs-dir" style={{ paddingLeft: 8 + node.depth * 16 }}>
      <Icon name="folder" size={14} strokeWidth={1.7} />
      {node.name}
    </div>
  );
}

function FileRow({
  node,
  active,
  status,
  onClick,
}: {
  node: DocNode;
  active: boolean;
  status: DocStatus;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? 'docs-file active' : 'docs-file'}
      style={{ paddingLeft: 8 + node.depth * 16 }}
      onClick={onClick}
    >
      <Icon name="file" size={14} strokeWidth={1.6} />
      <span className="docs-file-name">{node.name}</span>
      {status !== 'unchanged' && (
        <span
          className="docs-file-dot"
          title="Changed since last viewed"
          style={{ background: dotColor(status) }}
        />
      )}
    </button>
  );
}
