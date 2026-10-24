/**
 * A page drawn small.
 *
 * Thumbnails are the real document scaled down, not a cached bitmap, so a
 * preview can never show a stale version of the page it stands for.
 */

import type { ReactElement } from 'react';

import { paintToCss, type Design, type Page } from '../domain/document.js';
import type { MeasureText } from '../domain/textLayout.js';
import { ElementRenderer } from './ElementRenderer.js';

export interface PagePreviewProps {
  readonly design: Pick<Design, 'width' | 'height'>;
  readonly page: Page;
  readonly measure: MeasureText;
  /** Target width in CSS pixels; the height follows the document's ratio. */
  readonly width: number;
}

export const PagePreview = ({ design, page, measure, width }: PagePreviewProps): ReactElement => {
  const scale = width / design.width;
  return (
    <div
      className="page-preview"
      style={{ width: `${width}px`, height: `${design.height * scale}px`, background: paintToCss(page.background) }}
    >
      <div
        className="page-preview__surface"
        style={{
          width: `${design.width}px`,
          height: `${design.height}px`,
          transform: `scale(${scale})`,
        }}
      >
        {page.elements.map((element) => (
          <ElementRenderer key={element.id} element={element} measure={measure} />
        ))}
      </div>
    </div>
  );
};
