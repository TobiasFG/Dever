import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * A button-anchored floating panel. The `trigger` render-prop draws the anchor
 * (typically an `.icon-btn`); `children` render the panel and receive a `close`
 * callback. Closes on outside pointerdown and on Escape.
 */
export function Popover({
  trigger,
  children,
  align = 'end',
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="popover-anchor" ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div className="popover" data-align={align}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
