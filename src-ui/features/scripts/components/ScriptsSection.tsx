import type { Repo } from '@/features/repos/types';
import { useScripts } from '../useScripts';
import { ScriptList } from './ScriptList';
import { ScriptOutputModal } from './ScriptOutputModal';

/** The repo-detail "Scripts" section: the scripts found in this repo's
 * conventional script folders, each runnable with one click. */
export function ScriptsSection({ repo }: { repo: Repo }) {
  const { scripts, loading, error, running, result, run, clearResult } = useScripts(repo.path);

  return (
    <div className="section-scroll">
      <div className="section-inner detail-stack">
        <div className="detail-section-head">
          <h2 className="section-title">
            Scripts
            {scripts.length > 0 && <span className="count-pill">{scripts.length}</span>}
          </h2>
        </div>

        {error && <div className="empty">Couldn&apos;t load scripts: {error}</div>}

        {loading ? (
          <div className="empty">Scanning for scripts…</div>
        ) : (
          <ScriptList
            scripts={scripts}
            running={running}
            emptyText="No scripts found. Add runnable scripts under scripts/ or .dever/ in this repo."
            onRun={run}
          />
        )}
      </div>

      {result && <ScriptOutputModal run={result} onClose={clearResult} />}
    </div>
  );
}
