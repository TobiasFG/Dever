import { useMemo, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { ClaudePanel } from '@/features/claude/components/ClaudePanel';
import { useClaude } from '@/features/claude/useClaude';
import { RepoList } from '@/features/repos/components/RepoList';
import { RepoDetail } from '@/features/repos/components/detail/RepoDetail';
import { useRepos } from '@/features/repos/useRepos';
import { deriveRepo } from '@/features/repos/derive';
import type { RepoSection } from '@/features/repos/section';

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [section, setSection] = useState<RepoSection>('overview');

  const {
    repos,
    roots,
    editors,
    loading,
    error,
    refresh,
    addRoot,
    removeRoot,
    reorder,
    pull,
    pullAll,
  } = useRepos();
  const { status: claude, toggleMcp, togglePlugin, saveSystemPrompt } = useClaude();

  const views = useMemo(() => {
    const q = query.toLowerCase().trim();
    return repos
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.path.toLowerCase().includes(q) ||
          (r.branch?.toLowerCase().includes(q) ?? false),
      )
      .map(deriveRepo);
  }, [repos, query]);

  // The selected repo can vanish across a rescan — fall back to the dashboard.
  const selectedRepo = selectedPath ? (repos.find((r) => r.path === selectedPath) ?? null) : null;
  const inRepo = selectedRepo !== null;

  const openRepo = (path: string) => {
    setSelectedPath(path);
    setSection('overview');
  };
  const goHome = () => setSelectedPath(null);

  return (
    <div className="shell">
      <Sidebar
        inRepo={inRepo}
        activeSection={section}
        onSelectSection={setSection}
        onHome={goHome}
      />

      <main className="main">
        {inRepo && selectedRepo ? (
          <RepoDetail
            repo={selectedRepo}
            section={section}
            editors={editors}
            claude={claude}
            onBack={goHome}
            onSelectSection={setSection}
            onPull={pull}
          />
        ) : (
          <>
            <TopBar query={query} onChangeQuery={setQuery} />
            <div className="scroll">
              <div className="content">
                <div className="page-heading">
                  <h1>Dashboard</h1>
                  <p>
                    Tracking {repos.length} repositories across {roots.length} root folder
                    {roots.length === 1 ? '' : 's'}
                  </p>
                </div>

                {error && <div className="empty">Scan failed: {error}</div>}

                <div className="columns">
                  <RepoList
                    repos={views}
                    editors={editors}
                    query={query}
                    loading={loading}
                    roots={roots}
                    onAddRoot={addRoot}
                    onRescan={refresh}
                    onRemoveRoot={removeRoot}
                    onReorder={reorder}
                    onPull={pull}
                    onPullAll={pullAll}
                    onOpen={openRepo}
                  />
                  <ClaudePanel
                    status={claude}
                    onToggleMcp={toggleMcp}
                    onTogglePlugin={togglePlugin}
                    onSaveSystemPrompt={saveSystemPrompt}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
