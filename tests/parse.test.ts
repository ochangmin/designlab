import { describe, expect, it } from 'vitest';

import { parseDesign, parseDesignJson } from '../src/domain/parse.js';
import { createBlankDesign, TEMPLATES } from '../src/domain/templates.js';

describe('parseDesign', () => {
  it('round-trips every built-in template', () => {
    for (const template of TEMPLATES) {
      const design = template.build();
      const parsed = parseDesign(JSON.parse(JSON.stringify(design)));
      expect(parsed.ok, `${template.id} 파싱 실패`).toBe(true);
      if (!parsed.ok) continue;
      expect(parsed.value.pages.length).toBe(design.pages.length);
      expect(parsed.value.pages[0]?.elements.length).toBe(design.pages[0]?.elements.length);
    }
  });

  it('round-trips a blank design', () => {
    const design = createBlankDesign('빈 디자인', 800, 600);
    const parsed = parseDesign(JSON.parse(JSON.stringify(design)));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.name).toBe('빈 디자인');
  });

  it('reports where an unknown element type was found', () => {
    const parsed = parseDesign({
      id: 'd',
      pages: [
        {
          id: 'p',
          elements: [{ id: 'e', type: 'hologram' }],
        },
      ],
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.at).toBe('$.pages[0].elements[0].type');
  });

  it('rejects a document with no pages', () => {
    const parsed = parseDesign({ id: 'd', pages: [] });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.at).toBe('$.pages');
  });

  it('fills defaults for optional element fields', () => {
    const parsed = parseDesign({
      id: 'd',
      pages: [{ id: 'p', elements: [{ id: 'e', type: 'shape', shape: 'rectangle' }] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const element = parsed.value.pages[0]?.elements[0];
    expect(element?.opacity).toBe(1);
    expect(element?.rotation).toBe(0);
    expect(element?.shadow.enabled).toBe(false);
  });

  it('reports a JSON syntax error at the document root', () => {
    const parsed = parseDesignJson('{ not json');
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.at).toBe('$');
  });
});
