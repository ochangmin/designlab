import type { ReactElement } from 'react';

import { createText } from '../../../domain/elements.js';
import { TEXT_STYLES } from '../../../domain/presets.js';
import { layoutText } from '../../../domain/textLayout.js';
import { PanelSection } from '../../controls.js';
import { useEditorState, useMeasure, useStore } from '../../storeContext.js';

export const TextPanel = (): ReactElement => {
  const store = useStore();
  const measure = useMeasure();
  const { design } = useEditorState();

  const addStyle = (styleId: string): void => {
    const style = TEXT_STYLES.find((candidate) => candidate.id === styleId);
    if (!style) return;

    // Scale the preset to the document so a headline reads the same on a card
    // and on a poster, then size the box to the text it actually holds.
    const scale = Math.min(design.width, design.height) / 1080;
    const fontSize = Math.max(10, Math.round(style.fontSize * scale));
    const width = Math.round(design.width * 0.8);
    const font = {
      fontFamily: style.fontFamily,
      fontSize,
      fontWeight: style.fontWeight,
      italic: false,
      letterSpacing: style.letterSpacing * scale,
      lineHeight: style.lineHeight,
    };
    const content = style.uppercase ? style.sample.toLocaleUpperCase() : style.sample;
    const layout = layoutText(content, width, font, measure);
    const height = Math.max(fontSize, Math.round(layout.totalHeight));

    store.addElements([
      createText(
        style.sample,
        {
          x: Math.round((design.width - width) / 2),
          y: Math.round((design.height - height) / 2),
          width,
          height,
        },
        {
          fontFamily: style.fontFamily,
          fontSize,
          fontWeight: style.fontWeight,
          letterSpacing: Math.round(style.letterSpacing * scale * 10) / 10,
          lineHeight: style.lineHeight,
          uppercase: style.uppercase,
          align: 'left',
          name: style.label,
        },
      ),
    ]);
  };

  return (
    <div className="panel">
      <PanelSection title="텍스트 추가">
        <div className="text-styles">
          {TEXT_STYLES.map((style) => (
            <button key={style.id} type="button" className="text-style" onClick={() => addStyle(style.id)}>
              <span
                className="text-style__sample"
                style={{
                  fontFamily: `"${style.fontFamily}", system-ui, sans-serif`,
                  fontWeight: style.fontWeight,
                  letterSpacing: `${Math.max(-1, style.letterSpacing / 6)}px`,
                  textTransform: style.uppercase ? 'uppercase' : 'none',
                  fontSize: `${Math.min(26, 11 + style.fontSize / 8)}px`,
                }}
              >
                {style.sample.split('\n')[0]}
              </span>
              <span className="text-style__label">{style.label}</span>
            </button>
          ))}
        </div>
      </PanelSection>
      <p className="panel-note">캔버스에서 텍스트를 더블클릭하면 바로 수정할 수 있습니다.</p>
    </div>
  );
};
