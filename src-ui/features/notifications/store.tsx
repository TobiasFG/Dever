import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { ToastStack } from './components/ToastStack';
import { initialState, reducer, unreadCount } from './reducer';
import type { AppNotification, NotifyInput } from './types';

type NotificationContextValue = {
  items: AppNotification[];
  toasts: AppNotification[];
  unread: number;
  /** Raise a notification (shown as a toast and kept in history). Returns its id. */
  notify: (input: NotifyInput) => string;
  /** Stop showing a toast, but keep it in history. */
  hideToast: (id: string) => void;
  /** Remove a notification from history entirely. */
  dismiss: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

let counter = 0;
const nextId = () => `n_${Date.now().toString(36)}_${(counter++).toString(36)}`;

/**
 * App-wide toast + notification system. Any feature can `notify(...)` to surface
 * a transient toast that also lands in the notification center. Kept
 * feature-agnostic on purpose — the Ask feature is just its first caller.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const notify = useCallback((input: NotifyInput) => {
    const id = nextId();
    const item: AppNotification = {
      ...input,
      id,
      createdAt: Date.now(),
      read: false,
      toastVisible: true,
    };
    dispatch({ type: 'add', item });
    return id;
  }, []);

  const hideToast = useCallback((id: string) => dispatch({ type: 'hideToast', id }), []);
  const dismiss = useCallback((id: string) => dispatch({ type: 'dismiss', id }), []);
  const markAllRead = useCallback(() => dispatch({ type: 'markAllRead' }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      items: state.items,
      toasts: state.items.filter((n) => n.toastVisible),
      unread: unreadCount(state.items),
      notify,
      hideToast,
      dismiss,
      markAllRead,
      clear,
    }),
    [state.items, notify, hideToast, dismiss, markAllRead, clear],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastStack />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
