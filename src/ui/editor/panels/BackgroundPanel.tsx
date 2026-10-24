import type { ReactElement } from 'react';

import { GRADIENT_PRESETS, PALETTES, SIZE_PRESETS } from '../../../domain/presets.js';
import { ColorField, PanelSection } from '../../controls.js';
import { useEditorState, useStore } from '../../storeContext.js';

export const BackgroundPanel = (): ReactElement => {
  const store = useStore();
  const { design, activePageId } = useEditorState();
  const page = design.pages.find((candidate) => candidate.id === activePageId) ?? design.pages[0];

  if (!page) return <div className="panel" />;

  return (
    <div className="panel">
      <PanelSection title="페이지 배경">
        <ColorField
          label="단색"
          value={page.background.kind === 'solid' ? page.background.color : '#ffffff'}
          palette={design.palette}
          onChange={(color) => store.setBackground({ kind: 'solid', color })}
        />
      </PanelSection>

      <PanelSection title="그라디언트">
        <div className="panel-grid panel-grid--gradients">
          {GRADIENT_PRESETS.map((paint, index) => (
            <button
              key={index}
              type="button"
              className="gradient-tile"
              aria-label={`그라디언트 배경 ${index + 1}`}
              style={{
                background:
                  paint.kind === 'gradient'
                    ? `linear-gradient(${paint.angle}deg, ${paint.from}, ${paint.to})`
                    : undefined,
              }}
              onClick={() => store.setBackground(paint)}
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="브랜드 색상">
        <div className="palette-list">
          {PALETTES.map((palette) => (
            <div key={palette.id} className="palette-row">
              <button
                type="button"
                className="palette-row__apply"
                onClick={() => store.setPalette(palette.colors)}
                title={`${palette.label} 팔레트를 이 디자인에 사용`}
              >
                {palette.colors.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </button>
              <small>{palette.label}</small>
            </div>
          ))}
        </div>
        {design.palette.length > 0 && (
          <p className="panel-note">
            현재 팔레트가 색상 선택기 맨 앞에 표시됩니다.
          </p>
        )}
      </PanelSection>

      <PanelSection title="문서 크기">
        <div className="size-list">
          {SIZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`size-row${design.width === preset.width && design.height === preset.height ? ' is-active' : ''}`}
              onClick={() => store.resize(preset.width, preset.height)}
            >
              <span>{preset.label}</span>
              <small>{preset.hint}</small>
            </button>
          ))}
        </div>
        <p className="panel-note">크기를 바꿔도 요소 위치는 그대로 유지됩니다.</p>
      </PanelSection>
    </div>
  );
};
