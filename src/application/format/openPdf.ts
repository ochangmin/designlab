/**
 * Opening a `.pdf` as a DesignLab document.
 *
 * A PDF is a description of marks on a page, not a document of the kind this
 * editor edits: it has no notion of a text element you can retype or a shape
 * you can recolour. So each page arrives as one rendered image, faithful to
 * what a reader shows, and the person can build on top of it. That is stated
 * plainly rather than implied — an "import" that silently produced flat images
 * where someone expected editable text would be the wrong kind of surprise.
 */

import { createImage } from '../../domain/elements.js';
import type { StudioError } from '../../domain/errors.js';
import { createId } from '../../domain/ids.js';
import { err, ok, type Result } from '../../domain/result.js';
import { SCHEMA_VERSION, type Design, type Page } from '../../domain/document.js';
import type { ImportOutcome } from '../../domain/pptxImport.js';
import { loadCraftEngine } from './craftEngine.js';

const MAX_BYTES = 64 * 1024 * 1024;

/** Device pixels per PDF point. 1.5 is ~144 dpi: crisp without being huge. */
const RENDER_SCALE = 1.5;

/** A point is 4/3 of a CSS pixel at 96 dpi. */
const PX_PER_PT = 4 / 3;

/** Beyond this a deck is too large to hold in memory as data URLs. */
const MAX_PAGES = 100;

const MIXED_SIZES = '쪽마다 크기가 달라, 첫 쪽 크기에 맞춰 넣었습니다.';

const BASE64_CHUNK = 0x8000;

const toDataUrl = (bytes: Uint8Array): string => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK));
  }
  return `data:image/png;base64,${btoa(binary)}`;
};

const measureImage = (src: string): Promise<{ readonly width: number; readonly height: number } | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve(null);
    image.src = src;
  });

const designNameFrom = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.pdf$/i, '').trim();
  return withoutExtension === '' ? '가져온 PDF' : withoutExtension;
};

export const openPdfFile = async (
  file: File,
  password?: string,
): Promise<Result<ImportOutcome, StudioError>> => {
  if (file.size > MAX_BYTES) {
    return err({ kind: 'asset-too-large', fileName: file.name, bytes: file.size, limitBytes: MAX_BYTES });
  }

  const engine = await loadCraftEngine();
  if (!engine.ok) return engine;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const opened = engine.value.openPdf(bytes, password);
  if (!opened.ok) return opened;

  try {
    const total = opened.value.pageCount;
    if (total === 0) {
      return err({ kind: 'import-failed', format: 'PDF', detail: '페이지가 없거나 열 수 없는 파일입니다.' });
    }

    const notes: string[] = [
      'PDF의 각 페이지는 이미지 한 장으로 들어옵니다. 글자나 도형을 따로 수정할 수는 없고, 그 위에 요소를 올려 편집합니다.',
    ];
    const count = Math.min(total, MAX_PAGES);
    if (count < total) {
      notes.push(`${total}쪽 중 앞의 ${count}쪽만 가져왔습니다.`);
    }

    const pages: Page[] = [];
    let width = 0;
    let height = 0;

    for (let index = 0; index < count; index += 1) {
      const rendered = opened.value.renderPage(index, RENDER_SCALE);
      if (!rendered.ok) return rendered;

      const src = toDataUrl(rendered.value);
      const size = await measureImage(src);
      if (size === null) {
        return err({ kind: 'import-failed', format: 'PDF', detail: `${index + 1}쪽을 디코딩하지 못했습니다.` });
      }

      // The raster is `scale` device pixels per point; the document wants CSS
      // pixels, so the page size comes back through the point size.
      const pageWidth = Math.round((size.width / RENDER_SCALE) * PX_PER_PT);
      const pageHeight = Math.round((size.height / RENDER_SCALE) * PX_PER_PT);
      if (index === 0) {
        width = pageWidth;
        height = pageHeight;
      } else if ((pageWidth !== width || pageHeight !== height) && !notes.includes(MIXED_SIZES)) {
        notes.push(MIXED_SIZES);
      }

      pages.push({
        id: createId('pg'),
        name: `${index + 1}쪽`,
        background: { kind: 'solid', color: '#ffffff' },
        // Placed at the document's size, not the page's: a document has one
        // page size, so an odd page out is fitted rather than cropping the view.
        elements: [
          createImage(src, { x: 0, y: 0, width, height }, { name: `${index + 1}쪽`, fit: 'contain' }),
        ],
      });
    }

    const now = Date.now();
    const design: Design = {
      id: createId('dsn'),
      schemaVersion: SCHEMA_VERSION,
      name: designNameFrom(file.name),
      width,
      height,
      pages,
      palette: ['#111827', '#6d5efc', '#f472b6', '#facc15', '#ffffff'],
      createdAt: now,
      updatedAt: now,
    };

    return ok({ design, notes });
  } finally {
    opened.value.release();
  }
};
