import { describe, expect, it } from 'vitest';
import { initialState, reducer, unreadCount } from './reducer';
import type { AppNotification } from './types';

const make = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: 'a',
  kind: 'info',
  title: 't',
  createdAt: 0,
  read: false,
  toastVisible: true,
  ...over,
});

describe('notification reducer', () => {
  it('adds newest-first', () => {
    let s = reducer(initialState, { type: 'add', item: make({ id: 'a' }) });
    s = reducer(s, { type: 'add', item: make({ id: 'b' }) });
    expect(s.items.map((n) => n.id)).toEqual(['b', 'a']);
  });

  it('hideToast keeps the item but clears its toast flag', () => {
    const s0 = reducer(initialState, { type: 'add', item: make({ id: 'a' }) });
    const s1 = reducer(s0, { type: 'hideToast', id: 'a' });
    expect(s1.items).toHaveLength(1);
    expect(s1.items[0].toastVisible).toBe(false);
  });

  it('dismiss removes the item entirely', () => {
    const s0 = reducer(initialState, { type: 'add', item: make({ id: 'a' }) });
    const s1 = reducer(s0, { type: 'dismiss', id: 'a' });
    expect(s1.items).toHaveLength(0);
  });

  it('markAllRead flips every unread flag', () => {
    let s = reducer(initialState, { type: 'add', item: make({ id: 'a', read: false }) });
    s = reducer(s, { type: 'add', item: make({ id: 'b', read: false }) });
    s = reducer(s, { type: 'markAllRead' });
    expect(s.items.every((n) => n.read)).toBe(true);
  });

  it('clear empties the list', () => {
    const s0 = reducer(initialState, { type: 'add', item: make() });
    expect(reducer(s0, { type: 'clear' }).items).toEqual([]);
  });

  it('unreadCount counts unread only', () => {
    expect(unreadCount([make({ read: false }), make({ read: true }), make({ read: false })])).toBe(
      2,
    );
  });
});
