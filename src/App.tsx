import { useMemo, useState } from 'react';
import { Sidebar, NavId } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { StatCards } from '@/components/dashboard/StatCards';
import { RepoList } from '@/components/dashboard/RepoList';
import { ClaudePanel } from '@/components/dashboard/ClaudePanel';
import { deriveRepo, initialMcp, rawRepos } from '@/data/dashboard';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [query, setQuery] = useState('');
  const [mcp, setMcp] = useState(initialMcp);

  const repos = useMemo(() => {
    const q = query.toLowerCase().trim();
    return rawRepos
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.path.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q),
      )
      .map(deriveRepo);
  }, [query]);

  const activeMcp = mcp.filter((m) => m.on).length;
  const dirtyCount = rawRepos.filter((r) => r.changes > 0).length;
  const behindCount = rawRepos.filter((r) => r.behind > 0).length;

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
              <p>Tracking {rawRepos.length} repositories · last scanned 2 minutes ago</p>
            </div>

            <StatCards
              repoCount={rawRepos.length}
              dirtyCount={dirtyCount}
              behindCount={behindCount}
              activeMcp={activeMcp}
              mcpTotal={mcp.length}
            />

            <div className="columns">
              <RepoList repos={repos} query={query} />
              <ClaudePanel mcp={mcp} activeMcp={activeMcp} onToggleMcp={toggleMcp} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
