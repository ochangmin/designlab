/**
 * On-screen rendering of one element.
 *
 * This component is presentational and has no interaction of its own, so the
 * workspace, the page thumbnails and the template gallery all draw from it.
 * Text is rendered as the lines `layoutText` produced — not re-wrapped by the
 * browser — which is what keeps the editor and the exporters in agreement.
 */

import type { CSSProperties, ReactElement } from 'react';

import type { DesignElement, ImageFilters, Paint } from '../domain/document.js';
import { isStrokeOnly, shapePath } from '../domain/shapes.js';
import { layoutText, type MeasureText } from '../domain/textLayout.js';

const filterCss = (filters: ImageFilters): string | undefined => {
  const parts: string[] = [];
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.grayscale !== 0) parts.push(`grayscale(${filters.grayscale}%)`);
  return parts.length === 0 ? undefined : parts.join(' ');
};

const ShapeFill = ({ paint, id }: { paint: Paint; id: string }): ReactElement | null => {
  if (paint.kind !== 'gradient') return null;
  const radians = ((paint.angle - 90) * Math.PI) / 180;
  return (
    <defs>
      <linearGradient
        id={id}
        x1={0.5 - Math.cos(radians) / 2}
        y1={0.5 - Math.sin(radians) / 2}
        x2={0.5 + Math.cos(radians) / 2}
        y2={0.5 + Math.sin(radians) / 2}
      >
        <stop offset="0" stopColor={paint.from} />
        <stop offset="1" stopColor={paint.to} />
      </linearGradient>
    </defs>
  );
};

const fillValue = (paint: Paint, gradientId: string): string => {
  switch (paint.kind) {
    case 'none':
      return 'none';
    case 'solid':
      return paint.color;
    case 'gradient':
      return `url(#${gradientId})`;
  }
};

export interface ElementRendererProps {
  readonly element: DesignElement;
  readonly measure: MeasureText;
  /** Hidden while an inline text editor covers the element. */
  readonly suppressText?: boolean;
}

export const ElementRenderer = ({ element, measure, suppressText }: ElementRendererProps): ReactElement | null => {
  if (element.hidden) return null;

  const wrapper: CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    opacity: element.opacity,
    transform: element.rotation === 0 ? undefined : `rotate(${element.rotation}deg)`,
    filter: element.shadow.enabled
      ? `drop-shadow(${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur / 2}px ${element.shadow.color})`
      : undefined,
  };

  switch (element.type) {
    case 'shape': {
      const gradientId = `fill-${element.id}`;
      return (
        <div style={wrapper} data-element-kind="shape">
          <svg
            width={element.width}
            height={element.height}
            viewBox={`0 0 ${element.width} ${element.height}`}
            style={{ display: 'block', overflow: 'visible' }}
          >
            <ShapeFill paint={element.fill} id={gradientId} />
            <path
              d={shapePath(element.shape, element.width, element.height, element.radius)}
              fill={isStrokeOnly(element.shape) ? 'none' : fillValue(element.fill, gradientId)}
              stroke={element.stroke.width > 0 ? element.stroke.color : undefined}
              strokeWidth={element.stroke.width > 0 ? element.stroke.width : undefined}
              strokeLinecap="round"
              strokeDasharray={
                element.stroke.width > 0 && element.stroke.dash > 0
                  ? `${element.stroke.dash} ${element.stroke.dash * 1.4}`
                  : undefined
              }
            />
          </svg>
        </div>
      );
    }

    case 'icon':
      return (
        <div style={wrapper} data-element-kind="icon">
          <svg
            width={element.width}
            height={element.height}
            viewBox={`0 0 ${element.viewBox} ${element.viewBox}`}
            style={{ display: 'block' }}
          >
            <path d={element.pathData} fill={element.color} />
          </svg>
        </div>
      );

    case 'image':
      return (
        <div style={{ ...wrapper, overflow: 'hidden', borderRadius: `${element.radius}px` }} data-element-kind="image">
          <img
            src={element.src}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: element.fit === 'fill' ? 'fill' : element.fit,
              filter: filterCss(element.filters),
              display: 'block',
            }}
          />
        </div>
      );

    case 'text': {
      if (suppressText === true) return <div style={wrapper} data-element-kind="text" />;
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
      return (
        <div
          style={{
            ...wrapper,
            fontFamily: `"${element.fontFamily}", system-ui, sans-serif`,
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight,
            fontStyle: element.italic ? 'italic' : 'normal',
            letterSpacing: `${element.letterSpacing}px`,
            color: element.color,
            textAlign: element.align,
            textDecoration: element.underline ? 'underline' : 'none',
            whiteSpace: 'pre',
          }}
          data-element-kind="text"
        >
          {layout.lines.map((line, index) => (
            <div
              // Line order is the identity here: the same text re-wraps to the
              // same sequence, so the index is stable for this render.
              key={`${index}-${line}`}
              style={{ height: `${layout.lineHeightPx}px`, lineHeight: `${layout.lineHeightPx}px` }}
            >
              {line === '' ? '​' : line}
            </div>
          ))}
        </div>
      );
    }
  }
};
