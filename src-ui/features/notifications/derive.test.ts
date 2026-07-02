import { describe, expect, it } from 'vitest';
import { kindIcon, relativeTime } from './derive';

describe('notifications derive', () => {
  it('kindIcon maps each kind', () => {
    expect(kindIcon('success')).toBe('check');
    expect(kindIcon('error')).toBe('conflict');
    expect(kindIcon('info')).toBe('sparkles');
  });

  it('relativeTime buckets the elapsed time', () => {
    const now = 1_000_000_000;
    expect(relativeTime(now, now)).toBe('just now');
    expect(relativeTime(now - 5_000, now)).toBe('just now');
    expect(relativeTime(now - 30_000, now)).toBe('30s');
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m');
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h');
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d');
  });
});
