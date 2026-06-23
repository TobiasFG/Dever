/** Compact "time ago" label for a Unix-epoch-millis timestamp (e.g. "3h ago",
 * "just now"). Returns '' for a missing/zero timestamp. */
export function timeAgo(epochMs: number, now: number = Date.now()): string {
  if (!epochMs) return '';
  const secs = Math.max(0, Math.round((now - epochMs) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
