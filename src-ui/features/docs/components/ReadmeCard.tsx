import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useReadme } from '../useReadme';
import { Markdown } from './Markdown';

/** The repo's top-level readme, rendered on the repo overview. Long readmes are
 * clamped until expanded. Renders nothing when the repo has no readme. */
export function ReadmeCard({ repoPath, onOpenDocs }: { repoPath: string; onOpenDocs: () => void }) {
  const { readme, loading } = useReadme(repoPath);
  const [expanded, setExpanded] = useState(false);

  if (loading || !readme) return null;

  return (
    <div className="card">
      <div className="card-head">
        <span className="title">{readme.path}</span>
        <button className="link-btn" onClick={onOpenDocs}>
          All documentation
          <Icon name="chevronRight" size={14} strokeWidth={2} />
        </button>
      </div>
      <div className={expanded ? 'readme-body' : 'readme-body readme-body-clamped'}>
        <Markdown
          content={readme.content}
          path={readme.path}
          docPaths={new Set()}
          onNavigate={() => {}}
        />
      </div>
      <div className="readme-foot">
        <button className="readme-toggle" onClick={() => setExpanded((v) => !v)}>
          <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={14} strokeWidth={2} />
          {expanded ? 'Show less' : 'Show more'}
        </button>
      </div>
    </div>
  );
}
