import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { Icon } from '@/components/Icon';

/**
 * Reusable split-screen markdown editor modal: raw markdown on the left, a live
 * preview on the right. Feature-agnostic — the caller supplies the initial
 * content and handles persistence via `onSave`.
 */
export function MarkdownEditor({
  title,
  filePathLabel,
  initialContent,
  onSave,
  onClose,
}: {
  title: string;
  filePathLabel: string;
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => marked.parse(content, { async: false }) as string, [content]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(content);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md-overlay" onMouseDown={onClose}>
      <div className="md-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="md-head">
          <div className="md-title-group">
            <span className="md-title">{title}</span>
            <span className="md-path">{filePathLabel}</span>
          </div>
          <div className="md-actions">
            <button className="btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="md-close" title="Close" onClick={onClose} disabled={saving}>
              <Icon name="close" size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div className="md-split">
          <textarea
            className="md-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            placeholder="# Write markdown here…"
          />
          <div className="md-preview" dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
      </div>
    </div>
  );
}
