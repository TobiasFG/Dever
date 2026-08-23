import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

import { listDocs, readDoc, readReadme } from './api';

describe('docs api', () => {
  beforeEach(() => invoke.mockReset());

  it('listDocs passes the repo path', async () => {
    invoke.mockResolvedValue([]);
    await listDocs('/code/app');
    expect(invoke).toHaveBeenCalledWith('list_docs', { path: '/code/app' });
  });

  it('readDoc passes the repo path and the relative doc path', async () => {
    invoke.mockResolvedValue({ path: 'README.md', content: '# hi', modified: 1 });
    await readDoc('/code/app', 'README.md');
    expect(invoke).toHaveBeenCalledWith('read_doc', { path: '/code/app', rel: 'README.md' });
  });

  it('readReadme returns null for a repo without a readme', async () => {
    invoke.mockResolvedValue(null);
    await expect(readReadme('/code/app')).resolves.toBeNull();
    expect(invoke).toHaveBeenCalledWith('read_readme', { path: '/code/app' });
  });
});
