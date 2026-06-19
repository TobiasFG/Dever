import { colors } from '@/theme/colors';

export type RawRepo = {
  name: string;
  path: string;
  branch: string;
  changes: number;
  ahead: number;
  behind: number;
  conflict: boolean;
  features: string[];
};

export const rawRepos: RawRepo[] = [
  { name: 'acme-web', path: '~/code/acme-web', branch: 'main', changes: 0, ahead: 0, behind: 0, conflict: false, features: ['Docs', 'Endpoints'] },
  { name: 'payments-api', path: '~/code/payments-api', branch: 'feat/webhooks', changes: 4, ahead: 2, behind: 0, conflict: false, features: ['Endpoints', 'Docs'] },
  { name: 'dever', path: '~/projects/dever', branch: 'develop', changes: 7, ahead: 5, behind: 0, conflict: false, features: ['Docs', 'Endpoints'] },
  { name: 'design-system', path: '~/code/design-system', branch: 'release/2.4', changes: 0, ahead: 0, behind: 3, conflict: false, features: ['Docs'] },
  { name: 'mobile-app', path: '~/work/mobile-app', branch: 'fix/login-crash', changes: 1, ahead: 1, behind: 2, conflict: true, features: ['Endpoints'] },
  { name: 'data-pipeline', path: '~/code/data-pipeline', branch: 'main', changes: 0, ahead: 0, behind: 0, conflict: false, features: ['Endpoints'] },
  { name: 'marketing-site', path: '~/code/marketing-site', branch: 'main', changes: 0, ahead: 0, behind: 0, conflict: false, features: ['Docs'] },
  { name: 'infra', path: '~/work/infra', branch: 'chore/tf-upgrade', changes: 2, ahead: 0, behind: 1, conflict: false, features: [] },
];

export type DerivedRepo = {
  name: string;
  path: string;
  branch: string;
  ahead: number;
  behind: number;
  changesText: number;
  showChanges: boolean;
  showAhead: boolean;
  showBehind: boolean;
  showConflict: boolean;
  clean: boolean;
  dotColor: string;
  features: string[];
};

export function deriveRepo(r: RawRepo): DerivedRepo {
  const isDirty = r.changes > 0;
  const conflict = r.conflict;
  const clean = !isDirty && r.ahead === 0 && r.behind === 0 && !conflict;
  return {
    name: r.name,
    path: r.path,
    branch: r.branch,
    ahead: r.ahead,
    behind: r.behind,
    changesText: r.changes,
    showChanges: isDirty,
    showAhead: r.ahead > 0,
    showBehind: r.behind > 0,
    showConflict: conflict,
    clean,
    dotColor: conflict
      ? colors.red
      : isDirty
        ? colors.yellow
        : r.ahead > 0 || r.behind > 0
          ? colors.accent
          : colors.green,
    features: r.features,
  };
}

export type McpServer = {
  id: string;
  name: string;
  desc: string;
  on: boolean;
};

export const initialMcp: McpServer[] = [
  { id: 'filesystem', name: 'filesystem', desc: 'local file access', on: true },
  { id: 'github', name: 'github', desc: 'issues, PRs, repos', on: true },
  { id: 'postgres', name: 'postgres', desc: 'dev database', on: false },
  { id: 'puppeteer', name: 'puppeteer', desc: 'browser automation', on: true },
];
