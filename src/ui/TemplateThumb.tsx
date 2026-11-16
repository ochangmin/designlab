/**
 * A template's preview, built only once it is about to be seen.
 *
 * A thumbnail is the real document rendered small, which is what keeps it from
 * ever showing a stale design — but building every template in a catalogue of
 * several hundred would block the first paint. So the document is built when
 * the card approaches the viewport and kept for the rest of the session.
 *
 * The cached design is for display only. Opening a template always calls
 * `build()` again, so the editor receives fresh identity rather than a document
 * that shares element ids with a thumbnail still on screen.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';

import type { Design } from '../domain/document.js';
import type { TemplateDefinition } from '../domain/templateBuilders.js';
import type { MeasureText } from '../domain/textLayout.js';
import { PagePreview } from './PagePreview.js';

const previews = new Map<string, Design>();

export interface TemplateThumbProps {
  readonly template: TemplateDefinition;
  readonly measure: MeasureText;
  /** The box the preview is fitted inside, in CSS pixels. */
  readonly maxWidth: number;
  readonly maxHeight: number;
}

export const TemplateThumb = ({
  template,
  measure,
  maxWidth,
  maxHeight,
}: TemplateThumbProps): ReactElement => {
  const anchor = useRef<HTMLDivElement | null>(null);
  const [design, setDesign] = useState<Design | null>(() => previews.get(template.id) ?? null);

  useEffect(() => {
    if (design !== null) return;
    const node = anchor.current;
    if (!node) return;

    // Without the API — older browsers, tests — build straight away rather
    // than leaving an empty card forever.
    if (typeof IntersectionObserver === 'undefined') {
      setDesign(template.build());
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const built = previews.get(template.id) ?? template.build();
        previews.set(template.id, built);
        setDesign(built);
      },
      // A screen's worth of lead time, so a card is ready before it arrives.
      { rootMargin: '400px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [design, template]);

  if (design === null) {
    return <div className="template-thumb template-thumb--pending" ref={anchor} aria-hidden="true" />;
  }

  const firstPage = design.pages[0];
  if (!firstPage) return <div className="template-thumb" ref={anchor} aria-hidden="true" />;

  // Portrait documents are limited by height, landscape ones by width.
  const width = Math.min(maxWidth, (maxHeight * design.width) / design.height);

  return (
    <div className="template-thumb" ref={anchor}>
      <PagePreview design={design} page={firstPage} measure={measure} width={width} />
    </div>
  );
};
