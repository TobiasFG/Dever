import { useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { kindLabel } from '../derive';
import type { ScriptRun } from '../useScripts';

/** Modal showing a finished script's captured output: exit status, stdout and
 * stderr. Built on the same overlay shell as the Ask answer modal. */
export function ScriptOutputModal({ run, onClose }: { run: ScriptRun; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { script, result } = run;
  const status = result.success ? 'Exited 0' : `Exited ${result.exitCode ?? '—'}`;

  return (
    <div className="md-overlay" onMouseDown={onClose}>
      <div className="answer-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="answer-head">
          <div className="answer-head-main">
            <span className="answer-badge">
              <Icon name="terminal" size={12} strokeWidth={1.7} />
              {kindLabel(script.kind)}
            </span>
            <div className="answer-question">{script.name}</div>
          </div>
          <button className="md-close" title="Close" onClick={onClose}>
            <Icon name="close" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="answer-body">
          <div
            className="script-result-status"
            style={{ color: result.success ? colors.green : colors.red }}
          >
            {status} · {result.durationMs} ms
          </div>
          {result.stdout && <pre className="script-output">{result.stdout}</pre>}
          {result.stderr && <pre className="script-output script-output-err">{result.stderr}</pre>}
          {!result.stdout && !result.stderr && <div className="muted-row">No output.</div>}
        </div>
      </div>
    </div>
  );
}
