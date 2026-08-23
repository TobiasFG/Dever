import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { readReadme } = vi.hoisted(() => ({ readReadme: vi.fn() }));
vi.mock('../api', () => ({ readReadme }));

import { ReadmeCard } from './ReadmeCard';

describe('ReadmeCard', () => {
  it('renders nothing when the repo has no readme', async () => {
    readReadme.mockResolvedValue(null);
    const { container } = render(<ReadmeCard repoPath="/code/app" onOpenDocs={() => {}} />);
    await waitFor(() => expect(readReadme).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the readme markdown and its filename', async () => {
    readReadme.mockResolvedValue({ path: 'README.md', content: '# Hello', modified: 1 });
    render(<ReadmeCard repoPath="/code/app" onOpenDocs={() => {}} />);
    expect(await screen.findByText('README.md')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Hello' })).toBeInTheDocument();
  });
});
