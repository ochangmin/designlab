/**
 * Turning layouts into templates.
 *
 * Every layout is drawn once for each palette and each type scale, so ten
 * layouts become a hundred templates. The product is deliberate: a catalogue
 * this size cannot be hand-drawn without the hundredth entry being a tired
 * variation of the tenth, and composing it keeps every entry as considered as
 * the layout it came from.
 */

import type { Page } from '../document.js';
import { design, type TemplateCategory, type TemplateDefinition } from '../templateBuilders.js';
import { PALETTES, TYPE_SCALES, themeFor, type Theme } from './theme.js';

export interface Layout {
  readonly id: string;
  readonly label: string;
  readonly category: TemplateCategory;
  readonly width: number;
  readonly height: number;
  readonly build: (theme: Theme) => readonly Page[];
}

/** The swatches a composed design opens with: its own theme, ready to reuse. */
const swatchesOf = (theme: Theme): readonly string[] => [
  theme.palette.ink,
  theme.palette.accent,
  theme.palette.accentSoft,
  theme.palette.inkSoft,
  theme.palette.surface,
];

export const composeTemplates = (layouts: readonly Layout[]): readonly TemplateDefinition[] =>
  layouts.flatMap((layout) =>
    PALETTES.flatMap((palette) =>
      TYPE_SCALES.map((type) => {
        const label = `${layout.label} · ${palette.label} ${type.label}`;
        return {
          id: `${layout.id}-${palette.id}-${type.id}`,
          label,
          category: layout.category,
          build: () => {
            const theme = themeFor(palette, type, layout.width, layout.height);
            return design(label, layout.width, layout.height, swatchesOf(theme), layout.build(theme));
          },
        };
      }),
    ),
  );
