import { useMemo, useState } from 'react';
import { Sidebar, NavId } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { StatCards } from '@/components/dashboard/StatCards';
import { ClaudePanel } from '@/components/dashboard/ClaudePanel';
import { RepoList } from '@/features/repos/components/RepoList';
import { useRepos } from '@/features/repos/useRepos';
import { deriveRepo } from '@/features/repos/derive';
import { initialMcp } from '@/data/dashboard';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [query, setQuery] = useState('');
  const [mcp, setMcp] = useState(initialMcp);

  const { repos, roots, loading, error, refresh, addRoot } = useRepos();

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

  const activeMcp = mcp.filter((m) => m.on).length;
  const dirtyCount = repos.filter((r) => r.changes > 0).length;
  const behindCount = repos.filter((r) => r.behind > 0).length;

  const toggleMcp = (id: string) =>
    setMcp((prev) => prev.map((m) => (m.id === id ? { ...m, on: !m.on } : m)));

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

            <StatCards
              repoCount={repos.length}
              dirtyCount={dirtyCount}
              behindCount={behindCount}
              activeMcp={activeMcp}
              mcpTotal={mcp.length}
            />

            <div className="columns">
              <RepoList
                repos={views}
                query={query}
                loading={loading}
                onAddRoot={addRoot}
                onRescan={refresh}
              />
              <ClaudePanel mcp={mcp} activeMcp={activeMcp} onToggleMcp={toggleMcp} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
