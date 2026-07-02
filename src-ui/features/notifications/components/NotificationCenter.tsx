import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { useNotifications } from '../store';
import { kindIcon, relativeTime } from '../derive';
import type { AppNotification } from '../types';

/** The bell in the rail plus its dropdown history panel. Opening the panel
 * marks everything read (clears the badge); rows can be actioned or dismissed. */
export function NotificationCenter() {
  const { items, unread, markAllRead, dismiss, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  // Snapshot "now" when the panel opens so relative times are computed off an
  // event, not during render (which must stay pure).
  const [now, setNow] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      setNow(Date.now());
      if (unread > 0) markAllRead();
    }
  };

  return (
    <div className="notif-center" ref={ref}>
      <button
        className={open ? 'nav-btn active' : 'nav-btn'}
        title="Notifications"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon name="bell" size={22} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <span className="notif-title">Notifications</span>
            {items.length > 0 && (
              <button className="link-btn" onClick={clear}>
                Clear all
              </button>
            )}
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <div className="notif-empty">You&apos;re all caught up.</div>
            ) : (
              items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  now={now}
                  onDismiss={() => dismiss(n.id)}
                  onAction={() => {
                    n.onAction?.();
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification: n,
  now,
  onDismiss,
  onAction,
}: {
  notification: AppNotification;
  now: number;
  onDismiss: () => void;
  onAction: () => void;
}) {
  const actionable = Boolean(n.actionLabel && n.onAction);
  return (
    <div className={`notif-row notif-${n.kind}`}>
      <span className="notif-row-icon">
        <Icon name={kindIcon(n.kind)} size={15} strokeWidth={1.9} />
      </span>
      <div className="notif-row-body">
        <div className="notif-row-title">{n.title}</div>
        {n.body && <div className="notif-row-text">{n.body}</div>}
        <div className="notif-row-foot">
          <span className="notif-row-time">{relativeTime(n.createdAt, now)}</span>
          {actionable && (
            <button className="notif-row-action" onClick={onAction}>
              {n.actionLabel}
            </button>
          )}
        </div>
      </div>
      <button className="notif-row-dismiss" title="Dismiss" onClick={onDismiss}>
        <Icon name="close" size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
