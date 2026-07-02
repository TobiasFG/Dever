import type { AppNotification } from './types';

/** Pure state transitions for the notification store, split out so they can be
 * unit-tested without React. State is just the ordered list, newest first. */
export type NotificationState = { items: AppNotification[] };

export type NotificationAction =
  | { type: 'add'; item: AppNotification }
  | { type: 'hideToast'; id: string }
  | { type: 'dismiss'; id: string }
  | { type: 'markAllRead' }
  | { type: 'clear' };

export const initialState: NotificationState = { items: [] };

export function reducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'add':
      return { items: [action.item, ...state.items] };
    case 'hideToast':
      return {
        items: state.items.map((n) => (n.id === action.id ? { ...n, toastVisible: false } : n)),
      };
    case 'dismiss':
      return { items: state.items.filter((n) => n.id !== action.id) };
    case 'markAllRead':
      return { items: state.items.map((n) => (n.read ? n : { ...n, read: true })) };
    case 'clear':
      return { items: [] };
  }
}

/** Number of unread notifications — the bell's badge count. */
export function unreadCount(items: AppNotification[]): number {
  return items.filter((n) => !n.read).length;
}
