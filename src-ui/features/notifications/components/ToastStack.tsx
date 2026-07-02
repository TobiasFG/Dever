import { useEffect, useRef } from 'react';
import { Icon } from '@/components/Icon';
import { useNotifications } from '../store';
import { kindIcon } from '../derive';
import type { AppNotification } from '../types';

const TOAST_TTL = 7000;

/** Fixed stack of transient toasts in the bottom-right corner. Reads directly
 * from the notification store — anything raised via `notify()` shows here. */
export function ToastStack() {
  const { toasts, hideToast } = useNotifications();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onHide={() => hideToast(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onHide }: { toast: AppNotification; onHide: () => void }) {
  // Auto-dismiss after a delay; pause while the pointer is over the toast so a
  // reader isn't rushed. `onHide` is stable (a store callback), so re-arming on
  // each hover is cheap.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const arm = () => {
    timer.current = setTimeout(onHide, TOAST_TTL);
  };
  const disarm = () => clearTimeout(timer.current);

  useEffect(() => {
    arm();
    return disarm;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`toast toast-${toast.kind}`}
      role="status"
      onMouseEnter={disarm}
      onMouseLeave={arm}
    >
      <span className="toast-icon">
        <Icon name={kindIcon(toast.kind)} size={16} strokeWidth={1.9} />
      </span>
      <div className="toast-body">
        <div className="toast-title">{toast.title}</div>
        {toast.body && <div className="toast-text">{toast.body}</div>}
        {toast.actionLabel && toast.onAction && (
          <button
            className="toast-action"
            onClick={() => {
              toast.onAction?.();
              onHide();
            }}
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
      <button className="toast-close" title="Dismiss" onClick={onHide}>
        <Icon name="close" size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
