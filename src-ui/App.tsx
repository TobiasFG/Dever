import { useMemo, useState } from 'react';
import { Sidebar, NavId } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { ClaudePanel } from '@/features/claude/components/ClaudePanel';
import { useClaude } from '@/features/claude/useClaude';
import { RepoList } from '@/features/repos/components/RepoList';
import { useRepos } from '@/features/repos/useRepos';
import { deriveRepo } from '@/features/repos/derive';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [query, setQuery] = useState('');

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

  return (
    <div className="shell">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <main className="main">
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
      </main>
    </div>
  );
}
