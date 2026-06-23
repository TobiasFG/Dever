import type { CSSProperties } from 'react';
import { Icon, IconName } from '@/components/Icon';
import { REPO_SECTIONS, type RepoSection } from '@/features/repos/section';

const SECTION_ICON: Record<RepoSection, IconName> = {
  overview: 'dashboard',
  branches: 'branch',
  claude: 'claude',
  docs: 'docs',
  endpoints: 'endpoints',
};

/** A repo-section button. When no repo is open the rail items fade/slide out and
 * stop receiving clicks; opening a repo animates them back in, staggered. */
function SectionButton({
  icon,
  title,
  active,
  visible,
  index,
  onClick,
}: {
  icon: IconName;
  title: string;
  active: boolean;
  visible: boolean;
  index: number;
  onClick: () => void;
}) {
  const delay = visible ? index * 45 : 0;
  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-6px)',
    transition: visible
      ? `opacity 180ms ease ${delay}ms, transform 180ms ease ${delay}ms`
      : 'opacity 110ms ease, transform 110ms ease',
    pointerEvents: visible ? 'auto' : 'none',
  };
  return (
    <div style={style}>
      <button
        className={active ? 'nav-btn active' : 'nav-btn'}
        title={title}
        tabIndex={visible ? 0 : -1}
        onClick={onClick}
      >
        {active && <span className="nav-indicator" />}
        <Icon name={icon} size={22} />
      </button>
    </div>
  );
}

/**
 * The left icon rail. Its section items are contextual: they're hidden on the
 * dashboard and animate in when a repository is open, acting as that repo's
 * section navigator. The logo returns to the dashboard.
 */
export function Sidebar({
  inRepo,
  activeSection,
  onSelectSection,
  onHome,
}: {
  inRepo: boolean;
  activeSection: RepoSection;
  onSelectSection: (id: RepoSection) => void;
  onHome: () => void;
}) {
  return (
    <nav className="rail">
      <button className="rail-logo" title="Dashboard" onClick={onHome}>
        <Icon name="logo" size={22} strokeWidth={2} />
      </button>

      <div className="rail-group">
        {REPO_SECTIONS.map((item, i) => (
          <SectionButton
            key={item.id}
            icon={SECTION_ICON[item.id]}
            title={item.title}
            active={inRepo && activeSection === item.id}
            visible={inRepo}
            index={i}
            onClick={() => onSelectSection(item.id)}
          />
        ))}
      </div>

      <div className="rail-bottom">
        <button className="nav-btn" title="Settings">
          <Icon name="settings" size={22} />
        </button>
        <div className="avatar">MJ</div>
      </div>
    </nav>
  );
}
