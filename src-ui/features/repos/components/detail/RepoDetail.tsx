import { Icon } from '@/components/Icon';
import { Menu } from '@/components/Menu';
import { Popover } from '@/components/Popover';
import { DocsViewer } from '@/features/docs/components/DocsViewer';
import type { ClaudeStatus } from '@/features/claude/types';
import { openInEditor, openTerminal, revealInFileManager } from '../../api';
import { deriveDetail } from '../../derive';
import { type RepoSection, SECTION_LABEL } from '../../section';
import type { Editor, Repo } from '../../types';
import { OverviewSection } from './OverviewSection';
import { BranchesSection } from './BranchesSection';
import { ClaudeSection } from './ClaudeSection';

export function RepoDetail({
  repo,
  section,
  editors,
  claude,
  onBack,
  onSelectSection,
  onPull,
}: {
  repo: Repo;
  section: RepoSection;
  editors: Editor[];
  claude: ClaudeStatus | null;
  onBack: () => void;
  onSelectSection: (s: RepoSection) => void;
  onPull: (path: string) => Promise<void>;
}) {
  const detail = deriveDetail(repo);

  const openFile = (rel: string) => {
    if (editors.length === 0) return;
    void openInEditor(`${repo.path}/${rel}`, editors[0].id);
  };

  return (
    <>
      {/* contextual topbar with breadcrumb */}
      <header className="topbar detail-topbar">
        <div className="brand">
          <span className="brand-name">Dev&apos;er</span>
          <span className="brand-version">v0.1</span>
        </div>
        <div className="detail-divider" />
        <button className="btn-back" title="Back to dashboard" onClick={onBack}>
          <Icon name="back" size={16} strokeWidth={1.9} />
          Dashboard
        </button>
        <div className="detail-crumb">
          <span className="detail-crumb-sep">/</span>
          <span className="detail-crumb-name">{repo.name}</span>
          <span className="detail-crumb-sep">/</span>
          <span className="detail-crumb-section">{SECTION_LABEL[section]}</span>
        </div>
      </header>

      <div className="detail-body">
        {/* persistent identity header */}
        <div className="detail-id">
          <div className="detail-id-inner">
            <div className="detail-id-main">
              <div className="detail-id-title">
                <span className="dot detail-dot" style={{ background: detail.dotColor }} />
                <h1>{repo.name}</h1>
                <span
                  className="detail-status-pill"
                  style={{ color: detail.statusFg, background: detail.statusBg }}
                >
                  {detail.statusText}
                </span>
              </div>
              <div className="detail-path-row">
                <span className="detail-path">{repo.path}</span>
                <button
                  className="icon-btn detail-copy"
                  title="Copy path"
                  onClick={() => void navigator.clipboard.writeText(repo.path)}
                >
                  <Icon name="file" size={13} strokeWidth={1.7} />
                </button>
              </div>
            </div>
            <div className="detail-actions">
              <Popover
                trigger={({ open, toggle }) => (
                  <button
                    className="btn-secondary"
                    title="Open in a detected editor"
                    aria-expanded={open}
                    onClick={toggle}
                  >
                    <Icon name="editor" size={15} strokeWidth={1.8} />
                    Open in editor
                    <Icon name="chevronDown" size={13} strokeWidth={2} />
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
              <button
                className="btn-secondary"
                title="Start a terminal at the repo root"
                onClick={() => void openTerminal(repo.path)}
              >
                <Icon name="terminal" size={15} strokeWidth={1.8} />
                Terminal
              </button>
              <button
                className="btn-secondary"
                title="Reveal in file manager"
                onClick={() => void revealInFileManager(repo.path)}
              >
                <Icon name="folder" size={15} strokeWidth={1.8} />
                Reveal
              </button>
            </div>
          </div>
        </div>

        {/* section content */}
        {section === 'overview' && (
          <OverviewSection
            repo={repo}
            detail={detail}
            onPull={onPull}
            onViewBranches={() => onSelectSection('branches')}
          />
        )}
        {section === 'branches' && <BranchesSection repo={repo} />}
        {section === 'claude' && <ClaudeSection repo={repo} claude={claude} />}
        {section === 'docs' && (
          <DocsViewer repoPath={repo.path} onOpen={editors.length > 0 ? openFile : undefined} />
        )}
        {section === 'endpoints' && (
          <div className="section-scroll endpoints-empty">
            <div className="endpoints-card">
              <div className="endpoints-icon">
                <Icon name="endpoints" size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h3>Endpoints coming soon</h3>
                <p>
                  This feature will auto-discover and test the HTTP endpoints exposed by your
                  repository — surfacing routes, methods, and request shapes parsed from the source.
                </p>
              </div>
              <span className="endpoints-tag">On the roadmap</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
