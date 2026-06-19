import { Icon, IconName } from '@/components/Icon';

export type NavId = 'dashboard' | 'repos' | 'claude' | 'docs' | 'endpoints' | 'settings';

const navItems: { id: NavId; icon: IconName; title: string }[] = [
  { id: 'dashboard', icon: 'dashboard', title: 'Dashboard' },
  { id: 'repos', icon: 'repos', title: 'Repositories' },
  { id: 'claude', icon: 'claude', title: 'Claude Code' },
  { id: 'docs', icon: 'docs', title: 'Documentation' },
  { id: 'endpoints', icon: 'endpoints', title: 'Endpoints' },
];

function NavButton({
  icon,
  title,
  active,
  onClick,
}: {
  icon: IconName;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? 'nav-btn active' : 'nav-btn'} title={title} onClick={onClick}>
      {active && <span className="nav-indicator" />}
      <Icon name={icon} size={22} />
    </button>
  );
}

export function Sidebar({
  active,
  onNavigate,
}: {
  active: NavId;
  onNavigate: (id: NavId) => void;
}) {
  return (
    <nav className="rail">
      <div className="rail-logo">
        <Icon name="logo" size={22} strokeWidth={2} />
      </div>

      <div className="rail-group">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            title={item.title}
            active={active === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>

      <div className="rail-bottom">
        <NavButton
          icon="settings"
          title="Settings"
          active={active === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <div className="avatar">MJ</div>
      </div>
    </nav>
  );
}
