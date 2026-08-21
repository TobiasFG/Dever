import type { UpdateProgress, UpdateStatus } from './types';

/** How the version chip reads in each state, and whether clicking it does
 * anything. Pure so the whole state machine's presentation is unit-testable. */
export type UpdateView = {
  /** Chip text — the running version until an update enters the picture. */
  label: string;
  /** Tooltip: what clicking will do, or why nothing is happening. */
  title: string;
  /** True when the chip is a button rather than a plain label. */
  actionable: boolean;
  /** Set while an install is in flight and its size is known. */
  percent: number | null;
};

/** Download percentage, or `null` when the total size is unknown. */
export function progressPercent(progress: UpdateProgress | null): number | null {
  if (!progress || progress.total === null || progress.total <= 0) return null;
  return Math.min(100, Math.round((progress.downloaded / progress.total) * 100));
}

export function deriveUpdate(status: UpdateStatus): UpdateView {
  const running = `v${status.version}`;

  switch (status.state) {
    case 'checking':
      return { label: running, title: 'Checking for updates…', actionable: false, percent: null };

    case 'available':
      return {
        label: `Update to ${status.newVersion}`,
        title: status.notes
          ? `Dever ${status.newVersion} is available — click to install.\n\n${status.notes}`
          : `Dever ${status.newVersion} is available — click to install.`,
        actionable: true,
        percent: null,
      };

    case 'installing': {
      const percent = progressPercent(status.progress);
      return {
        label: percent === null ? 'Installing…' : `Installing ${percent}%`,
        title: `Installing Dever ${status.newVersion}`,
        actionable: false,
        percent,
      };
    }

    case 'ready':
      return {
        label: 'Restart to update',
        title: `Dever ${status.newVersion} is installed — click to restart.`,
        actionable: true,
        percent: null,
      };

    case 'error':
      return {
        label: running,
        title: `Update check failed: ${status.error ?? 'unknown error'}\n\nClick to try again.`,
        actionable: true,
        percent: null,
      };

    case 'idle':
      return {
        label: running,
        title: 'Up to date — click to check again.',
        actionable: true,
        percent: null,
      };
  }
}
