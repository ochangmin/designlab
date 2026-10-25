/**
 * The pieces every template is built from.
 *
 * A template is a function that produces a complete `Design` with fresh
 * identity, assembled from the same element factories the editor uses. There is
 * no separate template format to keep in step, and a template thumbnail is the
 * real document rendered small.
 *
 * These live apart from the catalogues so that each category of templates can
 * be its own module without any of them importing another.
 */

import { findIcon } from './icons.js';
import { createId } from './ids.js';
import { SCHEMA_VERSION, type Design, type DesignElement, type Page, type Paint } from './document.js';

export type TemplateCategory = '소셜' | '프레젠테이션' | '인쇄' | '마케팅';

export interface TemplateDefinition {
  readonly id: string;
  readonly label: string;
  readonly category: TemplateCategory;
  readonly build: () => Design;
}

export const page = (name: string, background: Paint, elements: readonly DesignElement[]): Page => ({
  id: createId('pg'),
  name,
  background,
  elements,
});

export const design = (
  name: string,
  width: number,
  height: number,
  palette: readonly string[],
  pages: readonly Page[],
): Design => {
  const now = Date.now();
  return {
    id: createId('dsn'),
    schemaVersion: SCHEMA_VERSION,
    name,
    width,
    height,
    pages,
    palette,
    createdAt: now,
    updatedAt: now,
  };
};

/** An icon's path data, or an empty path when the set no longer has it. */
export const iconPath = (id: string): string => findIcon(id)?.pathData ?? '';

/** A plain white page, the starting point for a blank document. */
export const WHITE: Paint = { kind: 'solid', color: '#ffffff' };
