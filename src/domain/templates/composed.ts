/**
 * The composed catalogue: ten layouts per category, each drawn in every
 * palette and type scale, so each category offers a hundred starting points.
 */

import { composeTemplates } from './compose.js';
import { MARKETING_LAYOUTS } from './layouts/marketing.js';
import { PRESENTATION_LAYOUTS } from './layouts/presentation.js';
import { PRINT_LAYOUTS } from './layouts/print.js';
import { SOCIAL_LAYOUTS } from './layouts/social.js';
import type { TemplateDefinition } from '../templateBuilders.js';

export const COMPOSED_TEMPLATES: readonly TemplateDefinition[] = [
  ...composeTemplates(SOCIAL_LAYOUTS),
  ...composeTemplates(MARKETING_LAYOUTS),
  ...composeTemplates(PRESENTATION_LAYOUTS),
  ...composeTemplates(PRINT_LAYOUTS),
];
