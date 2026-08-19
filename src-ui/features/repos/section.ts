/** The sections of the repo-detail screen, surfaced as the contextual sidebar
 * rail when a repo is open. */
export type RepoSection = 'overview' | 'branches' | 'scripts' | 'claude' | 'docs' | 'endpoints';

export const REPO_SECTIONS: { id: RepoSection; title: string }[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'branches', title: 'Branches' },
  { id: 'scripts', title: 'Scripts' },
  { id: 'claude', title: 'Claude Code' },
  { id: 'docs', title: 'Documentation' },
  { id: 'endpoints', title: 'Endpoints' },
];

export const SECTION_LABEL: Record<RepoSection, string> = {
  overview: 'Overview',
  branches: 'Branches',
  scripts: 'Scripts',
  claude: 'Claude Code',
  docs: 'Documentation',
  endpoints: 'Endpoints',
};
