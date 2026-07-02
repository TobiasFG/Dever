import type { NotificationKind } from './types';
import type { IconName } from '@/components/Icon';

/** Icon for a notification kind. */
export function kindIcon(kind: NotificationKind): IconName {
  if (kind === 'success') return 'check';
  if (kind === 'error') return 'conflict';
  return 'sparkles';
}

/** Compact "time ago" label for a notification, e.g. "just now", "4m", "2h". */
export function relativeTime(createdAt: number, now: number): string {
  const secs = Math.max(0, Math.round((now - createdAt) / 1000));
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
