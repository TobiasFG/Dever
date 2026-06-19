import { Icon } from '@/components/Icon';

export function TopBar({
  query,
  onChangeQuery,
}: {
  query: string;
  onChangeQuery: (q: string) => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-name">Dev&apos;er</span>
        <span className="brand-version">v0.1</span>
      </div>

      <div className="search-wrap">
        <div className="search-inner">
          <span className="search-icon">
            <Icon name="search" size={16} strokeWidth={2} />
          </span>
          <input
            className="search-input"
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Search repositories, branches, paths…"
          />
        </div>
      </div>

      <button className="btn-secondary" title="Rescan machine">
        <Icon name="rescan" size={15} strokeWidth={1.8} />
        Rescan
      </button>
    </header>
  );
}
