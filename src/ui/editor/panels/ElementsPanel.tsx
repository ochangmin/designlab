import type { ReactElement } from 'react';

import type { Paint, ShapeKind } from '../../../domain/document.js';
import { createIcon, createShape, SHAPE_LABELS } from '../../../domain/elements.js';
import { ICONS } from '../../../domain/icons.js';
import { GRADIENT_PRESETS } from '../../../domain/presets.js';
import { shapePath } from '../../../domain/shapes.js';
import { PanelSection } from '../../controls.js';
import { useEditorState, useStore } from '../../storeContext.js';

const SHAPES: readonly ShapeKind[] = [
  'rectangle',
  'ellipse',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
  'arrow',
  'speech',
  'line',
];

export const ElementsPanel = (): ReactElement => {
  const store = useStore();
  const { design } = useEditorState();

  /** Drop new content in the middle of the page at a sensible size. */
  const placement = (ratio: number): { x: number; y: number; width: number; height: number } => {
    const width = Math.round(Math.min(design.width, design.height) * ratio);
    const height = width;
    return {
      x: Math.round((design.width - width) / 2),
      y: Math.round((design.height - height) / 2),
      width,
      height,
    };
  };

  const addShape = (shape: ShapeKind, fill?: Paint): void => {
    const rect = placement(shape === 'line' ? 0.6 : 0.4);
    const sized = shape === 'line' ? { ...rect, height: 8 } : rect;
    store.addElements([createShape(shape, sized, fill === undefined ? {} : { fill })]);
  };

  return (
    <div className="panel">
      <PanelSection title="도형">
        <div className="panel-grid panel-grid--shapes">
          {SHAPES.map((shape) => (
            <button
              key={shape}
              type="button"
              className="shape-tile"
              title={SHAPE_LABELS[shape]}
              aria-label={SHAPE_LABELS[shape]}
              onClick={() => addShape(shape)}
            >
              <svg viewBox="0 0 48 48" width={34} height={34} aria-hidden="true">
                <path
                  d={shapePath(shape, 48, 48, shape === 'rectangle' ? 8 : 0)}
                  fill={shape === 'line' ? 'none' : 'currentColor'}
                  stroke={shape === 'line' ? 'currentColor' : 'none'}
                  strokeWidth={shape === 'line' ? 4 : 0}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="그라디언트 블록">
        <div className="panel-grid panel-grid--gradients">
          {GRADIENT_PRESETS.map((paint, index) => (
            <button
              key={index}
              type="button"
              className="gradient-tile"
              onClick={() => addShape('rectangle', paint)}
              aria-label={`그라디언트 ${index + 1} 추가`}
              style={{
                background:
                  paint.kind === 'gradient'
                    ? `linear-gradient(${paint.angle}deg, ${paint.from}, ${paint.to})`
                    : undefined,
              }}
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="아이콘">
        <div className="panel-grid panel-grid--icons">
          {ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className="icon-tile"
              title={icon.label}
              aria-label={`${icon.label} 추가`}
              onClick={() => {
                const rect = placement(0.22);
                store.addElements([createIcon(icon.label, icon.pathData, rect)]);
              }}
            >
              <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
                <path d={icon.pathData} fill="currentColor" />
              </svg>
            </button>
          ))}
        </div>
      </PanelSection>
    </div>
  );
};
