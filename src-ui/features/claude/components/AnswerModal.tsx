import { useEffect, useMemo } from 'react';
import { marked } from 'marked';
import { Icon } from '@/components/Icon';
import { answerMeta } from '../derive';
import type { AskRecord } from '../AskProvider';

// Drop raw embedded HTML — the answer is model output, not trusted markup.
const renderer = new marked.Renderer();
renderer.html = () => '';
const toHtml = (md: string) => marked.parse(md, { async: false, gfm: true, renderer }) as string;

/** Modal that shows a single Ask result: the question and Claude's answer, or
 * the failure reason if the run errored. */
export function AnswerModal({ record, onClose }: { record: AskRecord; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const html = useMemo(() => (record.answer ? toHtml(record.answer.answer) : ''), [record.answer]);

  return (
    <div className="md-overlay" onMouseDown={onClose}>
      <div className="answer-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="answer-head">
          <div className="answer-head-main">
            <span className="answer-badge">
              <Icon name="sparkles" size={12} strokeWidth={1.7} />
              {record.repoName}
            </span>
            <div className="answer-question">{record.question}</div>
          </div>
          <button className="md-close" title="Close" onClick={onClose}>
            <Icon name="close" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="answer-body">
          {record.answer ? (
            <>
              <div className="doc-body" dangerouslySetInnerHTML={{ __html: html }} />
              {answerMeta(record.answer) && (
                <div className="answer-meta">{answerMeta(record.answer)}</div>
              )}
            </>
          ) : record.error ? (
            <div className="ask-error">{record.error}</div>
          ) : (
            <div className="answer-pending">
              <span className="ask-typing">
                <span />
                <span />
                <span />
              </span>
              Still working on it…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
