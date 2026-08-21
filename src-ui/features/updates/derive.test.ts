import { describe, expect, it } from 'vitest';
import { deriveUpdate, progressPercent } from './derive';
import type { UpdateState, UpdateStatus } from './types';

const status = (state: UpdateState, over: Partial<UpdateStatus> = {}): UpdateStatus => ({
  state,
  version: '0.1.0',
  newVersion: null,
  notes: null,
  progress: null,
  error: null,
  ...over,
});

describe('progressPercent', () => {
  it('is null without progress or a known total', () => {
    expect(progressPercent(null)).toBeNull();
    expect(progressPercent({ downloaded: 10, total: null })).toBeNull();
    expect(progressPercent({ downloaded: 10, total: 0 })).toBeNull();
  });

  it('rounds the ratio and never exceeds 100', () => {
    expect(progressPercent({ downloaded: 512, total: 2048 })).toBe(25);
    expect(progressPercent({ downloaded: 1, total: 3 })).toBe(33);
    expect(progressPercent({ downloaded: 4096, total: 2048 })).toBe(100);
  });
});

describe('deriveUpdate', () => {
  it('shows the running version when idle, and invites a re-check', () => {
    const view = deriveUpdate(status('idle'));
    expect(view.label).toBe('v0.1.0');
    expect(view.actionable).toBe(true);
  });

  it('is inert while checking', () => {
    const view = deriveUpdate(status('checking'));
    expect(view.label).toBe('v0.1.0');
    expect(view.actionable).toBe(false);
  });

  it('offers the new version and carries the notes in the tooltip', () => {
    const view = deriveUpdate(status('available', { newVersion: '0.2.0', notes: 'Fixes things' }));
    expect(view.label).toBe('Update to 0.2.0');
    expect(view.actionable).toBe(true);
    expect(view.title).toContain('Fixes things');
  });

  it('reports install progress and blocks further clicks', () => {
    const view = deriveUpdate(
      status('installing', { newVersion: '0.2.0', progress: { downloaded: 50, total: 200 } }),
    );
    expect(view.label).toBe('Installing 25%');
    expect(view.percent).toBe(25);
    expect(view.actionable).toBe(false);
  });

  it('falls back to a size-less installing label', () => {
    const view = deriveUpdate(
      status('installing', { newVersion: '0.2.0', progress: { downloaded: 50, total: null } }),
    );
    expect(view.label).toBe('Installing…');
    expect(view.percent).toBeNull();
  });

  it('asks for a restart once installed', () => {
    const view = deriveUpdate(status('ready', { newVersion: '0.2.0' }));
    expect(view.label).toBe('Restart to update');
    expect(view.actionable).toBe(true);
  });

  it('keeps the version visible on failure and allows a retry', () => {
    const view = deriveUpdate(status('error', { error: 'network down' }));
    expect(view.label).toBe('v0.1.0');
    expect(view.title).toContain('network down');
    expect(view.actionable).toBe(true);
  });
});
