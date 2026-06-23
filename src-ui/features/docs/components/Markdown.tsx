import { useMemo, type MouseEvent } from 'react';
import { marked } from 'marked';

/**
 * Renders a doc's markdown to HTML with `marked` and styles it via the
 * `.doc-body` CSS. Relative links that resolve to another doc in the repo
 * navigate within the viewer; external links open in the OS browser. Raw
 * embedded HTML is dropped so a cloned repo's markdown can't inject markup.
 */

// Drop raw HTML blocks/spans — markdown features stay, embedded markup doesn't.
const renderer = new marked.Renderer();
renderer.html = () => '';

/** Resolve a link href relative to the current doc; return the target doc path
 * if it points at another doc in the repo, else null. */
function resolveInternal(href: string, baseDir: string, docPaths: Set<string>): string | null {
  if (/^[a-z]+:/i.test(href) || href.startsWith('#') || href.startsWith('//')) return null;
  const bare = href.split('#')[0].split('?')[0];
  if (!bare) return null;
  const parts = baseDir ? baseDir.split('/') : [];
  for (const seg of bare.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  const target = parts.join('/');
  return docPaths.has(target) ? target : null;
}

export function Markdown({
  content,
  path,
  docPaths,
  onNavigate,
}: {
  content: string;
  path: string;
  docPaths: Set<string>;
  onNavigate: (rel: string) => void;
}) {
  const baseDir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  const html = useMemo(
    () => marked.parse(content, { async: false, gfm: true, renderer }) as string,
    [content],
  );

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href') ?? '';
    e.preventDefault();
    const internal = resolveInternal(href, baseDir, docPaths);
    if (internal) onNavigate(internal);
    else if (/^[a-z]+:/i.test(href) || href.startsWith('//'))
      window.open(href, '_blank', 'noopener');
  };

  return <div className="doc-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
