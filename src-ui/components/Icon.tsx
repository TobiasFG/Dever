import { ReactNode } from 'react';

export type IconName =
  | 'logo'
  | 'dashboard'
  | 'repos'
  | 'claude'
  | 'docs'
  | 'endpoints'
  | 'settings'
  | 'search'
  | 'rescan'
  | 'branch'
  | 'check'
  | 'chevronUp'
  | 'chevronDown'
  | 'chevronRight'
  | 'back'
  | 'folder'
  | 'conflict'
  | 'editor'
  | 'terminal'
  | 'file'
  | 'plus'
  | 'gridSmall'
  | 'atom'
  | 'download'
  | 'open'
  | 'more'
  | 'swap'
  | 'grip'
  | 'close';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

// Each entry renders against a 24x24 viewBox with the shared stroke styling.
const paths: Record<IconName, ReactNode> = {
  logo: (
    <>
      <path d="M5 7l4 3.5-4 3.5" />
      <path d="M11.5 15h5" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </>
  ),
  repos: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="8" r="2.4" />
      <path d="M6 8.4v7.2" />
      <path d="M18 10.4c0 3.4-3.4 4-6 4.4" />
    </>
  ),
  claude: (
    <>
      <path d="M12 3.2l1.5 5.1 5.1 1.5-5.1 1.5L12 16.5l-1.5-5.2L5.4 9.8l5.1-1.5z" />
      <path d="M18 14.5l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z" />
    </>
  ),
  docs: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 0 4 21.5z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5A1.5 1.5 0 0 1 20 21.5z" />
    </>
  ),
  endpoints: (
    <>
      <path d="M8 4.5c-2 0-2 3-2 4.2s-1 2.3-2 2.3c1 0 2 1.1 2 2.3s0 4.2 2 4.2" />
      <path d="M16 4.5c2 0 2 3 2 4.2s1 2.3 2 2.3c-1 0-2 1.1-2 2.3s0 4.2-2 4.2" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  rescan: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3.5V9h-5.5" />
    </>
  ),
  branch: (
    <>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="8" r="2.4" />
      <path d="M6 8.4v7.2" />
      <path d="M18 10.4c0 3.4-3.4 4-6 4.4" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevronUp: <path d="M6 14l6-6 6 6" />,
  chevronDown: <path d="M6 10l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  back: <path d="M15 5l-7 7 7 7" />,
  folder: (
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.2H19.5A1.5 1.5 0 0 1 21 9.7v8.8A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5z" />
  ),
  conflict: (
    <>
      <path d="M12 3.8L21 20H3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  editor: (
    <>
      <path d="M9 8l-4 4 4 4" />
      <path d="M15 8l4 4-4 4" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7 9.5l3 2.5-3 2.5" />
      <path d="M13 14.5h4" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6" />
      <path d="M9 16.5h4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  gridSmall: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  atom: (
    <>
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  open: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="19" cy="12" r="1.4" />
    </>
  ),
  swap: (
    <>
      <path d="M7 4L3 8l4 4" />
      <path d="M3 8h13" />
      <path d="M17 20l4-4-4-4" />
      <path d="M21 16H8" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.3" />
      <circle cx="15" cy="6" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="15" cy="12" r="1.3" />
      <circle cx="9" cy="18" r="1.3" />
      <circle cx="15" cy="18" r="1.3" />
    </>
  ),
};

export function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flex: 'none' }}
    >
      {paths[name]}
    </svg>
  );
}
