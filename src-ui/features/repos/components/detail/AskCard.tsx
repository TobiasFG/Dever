import { useState, type KeyboardEvent } from 'react';
import { Icon } from '@/components/Icon';
import { useAsk, type AskRecord } from '@/features/claude/AskProvider';
import type { Repo } from '../../types';

const INSTALL_URL = 'https://www.claude.com/product/claude-code';
const PLACEHOLDER = 'Ask anything about this repository…';

/** Overview card that fires an async question to Claude Code. Answers arrive as
 * a notification; recent questions for this repo are listed with their status
 * and open the answer viewer on click. */
export function AskCard({ repo, detected }: { repo: Repo; detected: boolean }) {
  const { records, ask, view } = useAsk();
  const [draft, setDraft] = useState('');

  const mine = records.filter((r) => r.repoPath === repo.path).slice(0, 5);

  const submit = () => {
    if (!draft.trim()) return;
    ask(repo, draft);
    setDraft('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="card">
      <div className="card-head">
        <span className="title ask-card-title">
          <Icon name="chat" size={16} strokeWidth={1.7} />
          Ask Claude
        </span>
        <span className="ask-badge">
          <Icon name="sparkles" size={12} strokeWidth={1.7} />
          Haiku · read-only
        </span>
      </div>

      {detected ? (
        <div className="card-pad ask-card-pad">
          <div className="ask-field">
            <textarea
              className="ask-input"
              placeholder={PLACEHOLDER}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              className="ask-send"
              title="Ask (Enter)"
              disabled={!draft.trim()}
              onClick={submit}
            >
              <Icon name="send" size={16} strokeWidth={1.9} />
            </button>
          </div>
          <div className="ask-hint">
            Answered in the background — you&apos;ll get a notification when it&apos;s ready.
          </div>

          {mine.length > 0 && (
            <div className="ask-records">
              {mine.map((r) => (
                <RecordRow key={r.id} record={r} onView={() => view(r.id)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card-pad ask-not-detected">
          <span>Claude Code isn&apos;t detected on this machine.</span>
          <a className="link-btn" href={INSTALL_URL} target="_blank" rel="noreferrer">
            Get Claude Code
            <Icon name="open" size={13} strokeWidth={1.9} />
          </a>
        </div>
      )}
    </div>
  );
}

function RecordRow({ record, onView }: { record: AskRecord; onView: () => void }) {
  const pending = record.status === 'pending';
  return (
    <button className="ask-record" onClick={onView} disabled={pending}>
      <span className={`ask-record-icon ask-record-${record.status}`}>
        {pending ? (
          <span className="ask-spinner" />
        ) : record.status === 'ready' ? (
          <Icon name="check" size={14} strokeWidth={2.2} />
        ) : (
          <Icon name="conflict" size={14} strokeWidth={2} />
        )}
      </span>
      <span className="ask-record-q">{record.question}</span>
      <span className="ask-record-status">
        {pending ? 'Thinking…' : record.status === 'ready' ? 'View' : 'Failed'}
        {!pending && <Icon name="chevronRight" size={13} strokeWidth={2} />}
      </span>
    </button>
  );
}
