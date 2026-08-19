import type { IconName } from '@/components/Icon';
import type { ScriptKind } from './types';

/** Human-readable label for a script's interpreter family. */
export function kindLabel(kind: ScriptKind): string {
  switch (kind) {
    case 'powerShell':
      return 'PowerShell';
    case 'shell':
      return 'Shell';
    case 'batch':
      return 'Batch';
    case 'python':
      return 'Python';
    case 'node':
      return 'Node';
  }
}

/** Icon representing a script's interpreter family. */
export function kindIcon(kind: ScriptKind): IconName {
  switch (kind) {
    case 'powerShell':
    case 'shell':
    case 'batch':
      return 'terminal';
    case 'python':
    case 'node':
      return 'file';
  }
}

/** The directory a script lives in — used as the working directory for a
 * global script that isn't tied to a repo. */
export function scriptDir(path: string): string {
  const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return cut > 0 ? path.slice(0, cut) : path;
}
