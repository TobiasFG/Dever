import { Icon, IconName } from '@/components/Icon';

export type MenuItem = {
  icon: IconName;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Keep the popover open after selecting (e.g. to swap to a sub-panel). */
  keepOpen?: boolean;
};

/** Icon + text rows for a Popover panel. Selecting a row runs it and closes. */
export function Menu({ items, close }: { items: MenuItem[]; close: () => void }) {
  return (
    <div className="menu" role="menu">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="menu-item"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            if (!item.keepOpen) close();
          }}
        >
          <Icon name={item.icon} size={14} strokeWidth={1.8} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
