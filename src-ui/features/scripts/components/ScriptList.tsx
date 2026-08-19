import { Icon } from '@/components/Icon';
import { kindIcon, kindLabel } from '../derive';
import type { Script } from '../types';

/** The shared list of runnable scripts with a per-row Run button, used by both
 * the per-repo section and the global dashboard panel. */
export function ScriptList({
  scripts,
  running,
  emptyText,
  onRun,
}: {
  scripts: Script[];
  running: string | null;
  emptyText: string;
  onRun: (script: Script) => void;
}) {
  if (scripts.length === 0) {
    return <div className="empty">{emptyText}</div>;
  }
  return (
    <div className="card">
      {scripts.map((script) => {
        const busy = running === script.path;
        return (
          <div className="script-row" key={script.path}>
            <div className="script-info">
              <span className="script-icon">
                <Icon name={kindIcon(script.kind)} size={16} strokeWidth={1.7} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="script-name">{script.name}</div>
                <div className="script-sub">
                  {script.relPath} · {kindLabel(script.kind)}
                </div>
              </div>
            </div>
            <button
              className="btn-primary btn-icon"
              disabled={busy}
              title={`Run ${script.name}`}
              onClick={() => onRun(script)}
            >
              {busy ? (
                'Running…'
              ) : (
                <>
                  <Icon name="send" size={14} strokeWidth={2} />
                  Run
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
