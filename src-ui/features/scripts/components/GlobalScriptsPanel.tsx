import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { getScriptsRoot, setScriptsRoot } from '../api';
import { useScripts } from '../useScripts';
import { ScriptList } from './ScriptList';
import { ScriptOutputModal } from './ScriptOutputModal';

/** Dashboard panel for scripts that aren't tied to a repo: the user points at a
 * global folder and runs anything found under it. */
export function GlobalScriptsPanel() {
  const [root, setRoot] = useState<string | null>(null);
  const { scripts, loading, running, result, run, clearResult, refresh } = useScripts(null);

  useEffect(() => {
    void getScriptsRoot().then(setRoot);
  }, []);

  const pickFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select a global scripts folder',
    });
    if (typeof selected !== 'string') return;
    await setScriptsRoot(selected);
    setRoot(selected);
    await refresh();
  };

  return (
    <aside className="panel">
      <div className="section-head">
        <h2 className="section-title">
          Scripts
          <span className="panel-tag">global</span>
        </h2>
        <button className="link-btn" onClick={() => void pickFolder()}>
          {root ? 'Change folder' : 'Set folder'}
        </button>
      </div>

      <div className="panel-body">
        {root ? (
          <>
            <div className="card">
              <div className="card-pad file-path">{root}</div>
            </div>
            {loading ? (
              <div className="empty">Scanning for scripts…</div>
            ) : (
              <ScriptList
                scripts={scripts}
                running={running}
                emptyText="No scripts found in this folder."
                onRun={run}
              />
            )}
          </>
        ) : (
          <div className="empty">Pick a folder of scripts to run them from anywhere.</div>
        )}
      </div>

      {result && <ScriptOutputModal run={result} onClose={clearResult} />}
    </aside>
  );
}
