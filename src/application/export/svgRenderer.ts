/**
 * SVG serialisation of a page.
 *
 * Shapes and icons carry their path data straight through. Text is emitted as
 * one `<tspan>` per laid-out line, using the same line breaking as the editor,
 * so the exported file keeps the breaks the author saw instead of relying on
 * the viewer's own wrapping (SVG 1.1 has none).
 */

import type { Design, DesignElement, Page, Paint } from '../../domain/document.js';
import { isStrokeOnly, shapePath } from '../../domain/shapes.js';
import { layoutText, type MeasureText } from '../../domain/textLayout.js';

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

interface Defs {
  readonly markup: string[];
  nextId: number;
}

const paintRef = (paint: Paint, defs: Defs): string => {
  switch (paint.kind) {
    case 'none':
      return 'none';
    case 'solid':
      return escapeXml(paint.color);
    case 'gradient': {
      const id = `grad${defs.nextId}`;
      defs.nextId += 1;
      // Convert the CSS angle to the unit vector SVG wants.
      const radians = ((paint.angle - 90) * Math.PI) / 180;
      const x1 = 0.5 - Math.cos(radians) / 2;
      const y1 = 0.5 - Math.sin(radians) / 2;
      const x2 = 0.5 + Math.cos(radians) / 2;
      const y2 = 0.5 + Math.sin(radians) / 2;
      defs.markup.push(
        `<linearGradient id="${id}" x1="${x1.toFixed(4)}" y1="${y1.toFixed(4)}" x2="${x2.toFixed(4)}" y2="${y2.toFixed(4)}">` +
          `<stop offset="0" stop-color="${escapeXml(paint.from)}"/>` +
          `<stop offset="1" stop-color="${escapeXml(paint.to)}"/>` +
          '</linearGradient>',
      );
      return `url(#${id})`;
    }
  }
};

const transformOf = (element: DesignElement): string => {
  const place = `translate(${element.x} ${element.y})`;
  if (element.rotation === 0) return place;
  // Rotation is about the element's own centre, expressed in its local frame.
  return `${place} rotate(${element.rotation} ${element.width / 2} ${element.height / 2})`;
};

const elementMarkup = (element: DesignElement, defs: Defs, measure: MeasureText): string => {
  if (element.hidden || element.opacity === 0) return '';
  const opacity = element.opacity === 1 ? '' : ` opacity="${element.opacity}"`;
  const open = `<g transform="${transformOf(element)}"${opacity}>`;

  switch (element.type) {
    case 'shape': {
      const path = shapePath(element.shape, element.width, element.height, element.radius);
      const fill = isStrokeOnly(element.shape) ? 'none' : paintRef(element.fill, defs);
      const stroke =
        element.stroke.width > 0
          ? ` stroke="${escapeXml(element.stroke.color)}" stroke-width="${element.stroke.width}" stroke-linecap="round"${
              element.stroke.dash > 0 ? ` stroke-dasharray="${element.stroke.dash} ${element.stroke.dash * 1.4}"` : ''
            }`
          : '';
      return `${open}<path d="${path}" fill="${fill}"${stroke}/></g>`;
    }

    case 'icon': {
      const scale = `scale(${element.width / element.viewBox} ${element.height / element.viewBox})`;
      return `${open}<g transform="${scale}"><path d="${escapeXml(element.pathData)}" fill="${escapeXml(element.color)}"/></g></g>`;
    }

    case 'image': {
      const clipId = `clip${defs.nextId}`;
      defs.nextId += 1;
      defs.markup.push(
        `<clipPath id="${clipId}"><path d="${shapePath('rectangle', element.width, element.height, element.radius)}"/></clipPath>`,
      );
      const preserve = element.fit === 'fill' ? 'none' : element.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
      return (
        `${open}<g clip-path="url(#${clipId})">` +
        `<image href="${escapeXml(element.src)}" x="0" y="0" width="${element.width}" height="${element.height}" preserveAspectRatio="${preserve}"/>` +
        '</g></g>'
      );
    }

    case 'text': {
      const font = {
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        italic: element.italic,
        letterSpacing: element.letterSpacing,
        lineHeight: element.lineHeight,
      };
      const content = element.uppercase ? element.text.toLocaleUpperCase() : element.text;
      const layout = layoutText(content, element.width, font, measure);
      const anchor = element.align === 'center' ? 'middle' : element.align === 'right' ? 'end' : 'start';
      const originX = element.align === 'center' ? element.width / 2 : element.align === 'right' ? element.width : 0;
      const tspans = layout.lines
        .map((line, index) => {
          const baseline =
            index * layout.lineHeightPx + (layout.lineHeightPx - element.fontSize) / 2 + element.fontSize * 0.8;
          return `<tspan x="${originX}" y="${baseline.toFixed(2)}">${escapeXml(line)}</tspan>`;
        })
        .join('');
      return (
        `${open}<text font-family="${escapeXml(element.fontFamily)}" font-size="${element.fontSize}" ` +
        `font-weight="${element.fontWeight}"${element.italic ? ' font-style="italic"' : ''} ` +
        `letter-spacing="${element.letterSpacing}" fill="${escapeXml(element.color)}" text-anchor="${anchor}"` +
        `${element.underline ? ' text-decoration="underline"' : ''}>${tspans}</text></g>`
      );
    }
  }
};

export const renderPageToSvg = (design: Design, page: Page, measure: MeasureText): string => {
  const defs: Defs = { markup: [], nextId: 0 };
  const background = paintRef(page.background, defs);
  const body = page.elements.map((element) => elementMarkup(element, defs, measure)).join('');
  const defsMarkup = defs.markup.length === 0 ? '' : `<defs>${defs.markup.join('')}</defs>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${design.width}" height="${design.height}" ` +
    `viewBox="0 0 ${design.width} ${design.height}">` +
    `${defsMarkup}<rect x="0" y="0" width="${design.width}" height="${design.height}" fill="${background}"/>` +
    `${body}</svg>`
  );
};
