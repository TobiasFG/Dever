/** Severity of a notification — drives its icon and accent color. */
export type NotificationKind = 'info' | 'success' | 'error';

/** What a caller supplies to raise a notification. An optional action turns the
 * toast (and its history row) into a button — e.g. "View answer". */
export type NotifyInput = {
  kind: NotificationKind;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** A raised notification. Lives in the history until dismissed; `toastVisible`
 * is true only while it's shown as a transient toast. */
export type AppNotification = NotifyInput & {
  id: string;
  createdAt: number;
  read: boolean;
  toastVisible: boolean;
};
