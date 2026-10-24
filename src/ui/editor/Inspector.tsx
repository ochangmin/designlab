/**
 * The right-hand inspector.
 *
 * It shows the properties of what is selected and nothing else: with no
 * selection it falls back to the document itself. Multi-selection edits apply
 * to every selected element, and the displayed value comes from the first one —
 * the inspector never invents a merged value that no element actually has.
 */

import type { ReactElement } from 'react';

import type { DesignElement, ImageFit, Paint, ShapeKind, TextAlign } from '../../domain/document.js';
import { FONTS, weightsFor } from '../../domain/presets.js';
import { ColorField, NumberField, PanelSection, Row, Segmented, Slider } from '../controls.js';
import { useEditorState, useStore } from '../storeContext.js';

const ALIGN_OPTIONS = [
  { value: 'left' as TextAlign, label: '왼쪽', title: '왼쪽 맞춤' },
  { value: 'center' as TextAlign, label: '가운데', title: '가운데 맞춤' },
  { value: 'right' as TextAlign, label: '오른쪽', title: '오른쪽 맞춤' },
];

const FIT_OPTIONS = [
  { value: 'cover' as ImageFit, label: '채우기' },
  { value: 'contain' as ImageFit, label: '맞추기' },
  { value: 'fill' as ImageFit, label: '늘이기' },
];

const PaintEditor = ({
  label,
  paint,
  palette,
  onChange,
}: {
  label: string;
  paint: Paint;
  palette: readonly string[];
  onChange: (paint: Paint) => void;
}): ReactElement => (
  <>
    <Segmented
      ariaLabel={`${label} 종류`}
      value={paint.kind}
      options={[
        { value: 'solid', label: '단색' },
        { value: 'gradient', label: '그라디언트' },
        { value: 'none', label: '없음' },
      ]}
      onChange={(kind) => {
        if (kind === 'none') {
          onChange({ kind: 'none' });
          return;
        }
        if (kind === 'solid') {
          onChange({ kind: 'solid', color: paint.kind === 'gradient' ? paint.from : '#6d5efc' });
          return;
        }
        onChange({
          kind: 'gradient',
          from: paint.kind === 'solid' ? paint.color : '#6d5efc',
          to: '#f472b6',
          angle: 135,
        });
      }}
    />
    {paint.kind === 'solid' && (
      <ColorField label={label} value={paint.color} palette={palette} onChange={(color) => onChange({ kind: 'solid', color })} />
    )}
    {paint.kind === 'gradient' && (
      <>
        <ColorField
          label="시작 색"
          value={paint.from}
          palette={palette}
          onChange={(from) => onChange({ ...paint, from })}
        />
        <ColorField label="끝 색" value={paint.to} palette={palette} onChange={(to) => onChange({ ...paint, to })} />
        <Slider
          label="각도"
          min={0}
          max={360}
          value={paint.angle}
          onChange={(angle) => onChange({ ...paint, angle })}
          format={(value) => `${Math.round(value)}°`}
        />
      </>
    )}
  </>
);

const TextSection = ({ element }: { element: Extract<DesignElement, { type: 'text' }> }): ReactElement => {
  const store = useStore();
  const { design } = useEditorState();
  const weights = weightsFor(element.fontFamily);

  return (
    <PanelSection title="텍스트">
      <select
        className="select"
        value={element.fontFamily}
        aria-label="글꼴"
        onChange={(event) => {
          const fontFamily = event.target.value;
          const allowed = weightsFor(fontFamily);
          store.updateSelection((current) =>
            current.type === 'text'
              ? {
                  fontFamily,
                  fontWeight: allowed.includes(current.fontWeight) ? current.fontWeight : (allowed[0] ?? 400),
                }
              : {},
          );
        }}
      >
        {FONTS.map((font) => (
          <option key={font.family} value={font.family}>
            {font.label}
            {font.supportsKorean ? ' · 한글' : ''}
          </option>
        ))}
      </select>

      <Row>
        <NumberField
          label="크기"
          value={element.fontSize}
          min={4}
          max={800}
          onChange={(fontSize) => store.updateSelection(() => ({ fontSize }), { coalesce: 'font-size' })}
        />
        <label className="field">
          <span className="field__label">굵기</span>
          <select
            className="select"
            value={element.fontWeight}
            onChange={(event) => store.updateSelection(() => ({ fontWeight: Number(event.target.value) }))}
          >
            {weights.map((weight) => (
              <option key={weight} value={weight}>
                {weight}
              </option>
            ))}
          </select>
        </label>
      </Row>

      <Segmented ariaLabel="문단 정렬" value={element.align} options={ALIGN_OPTIONS} onChange={(align) => store.updateSelection(() => ({ align }))} />

      <div className="button-row">
        <button
          type="button"
          className={`button button--toggle${element.italic ? ' is-active' : ''}`}
          onClick={() => store.updateSelection((current) => (current.type === 'text' ? { italic: !current.italic } : {}))}
        >
          기울임
        </button>
        <button
          type="button"
          className={`button button--toggle${element.underline ? ' is-active' : ''}`}
          onClick={() =>
            store.updateSelection((current) => (current.type === 'text' ? { underline: !current.underline } : {}))
          }
        >
          밑줄
        </button>
        <button
          type="button"
          className={`button button--toggle${element.uppercase ? ' is-active' : ''}`}
          onClick={() =>
            store.updateSelection((current) => (current.type === 'text' ? { uppercase: !current.uppercase } : {}))
          }
        >
          대문자
        </button>
      </div>

      <Slider
        label="줄 간격"
        min={0.8}
        max={3}
        step={0.05}
        value={element.lineHeight}
        onChange={(lineHeight) => store.updateSelection(() => ({ lineHeight }), { coalesce: 'line-height' })}
        format={(value) => value.toFixed(2)}
      />
      <Slider
        label="자간"
        min={-20}
        max={60}
        step={0.5}
        value={element.letterSpacing}
        onChange={(letterSpacing) => store.updateSelection(() => ({ letterSpacing }), { coalesce: 'letter-spacing' })}
        format={(value) => `${value}px`}
      />
      <ColorField
        label="글자 색"
        value={element.color}
        palette={design.palette}
        onChange={(color) => store.updateSelection(() => ({ color }), { coalesce: 'text-color' })}
      />
    </PanelSection>
  );
};

const ShapeSection = ({ element }: { element: Extract<DesignElement, { type: 'shape' }> }): ReactElement => {
  const store = useStore();
  const { design } = useEditorState();
  const supportsRadius: readonly ShapeKind[] = ['rectangle'];

  return (
    <PanelSection title="도형">
      <PaintEditor
        label="채우기"
        paint={element.fill}
        palette={design.palette}
        onChange={(fill) => store.updateSelection(() => ({ fill }), { coalesce: 'fill' })}
      />
      <ColorField
        label="선 색"
        value={element.stroke.color}
        palette={design.palette}
        onChange={(color) =>
          store.updateSelection(
            (current) => (current.type === 'shape' ? { stroke: { ...current.stroke, color } } : {}),
            { coalesce: 'stroke-color' },
          )
        }
      />
      <Row>
        <NumberField
          label="선 두께"
          value={element.stroke.width}
          min={0}
          max={120}
          onChange={(width) =>
            store.updateSelection((current) => (current.type === 'shape' ? { stroke: { ...current.stroke, width } } : {}), {
              coalesce: 'stroke-width',
            })
          }
        />
        <NumberField
          label="점선 길이"
          value={element.stroke.dash}
          min={0}
          max={200}
          onChange={(dash) =>
            store.updateSelection((current) => (current.type === 'shape' ? { stroke: { ...current.stroke, dash } } : {}), {
              coalesce: 'stroke-dash',
            })
          }
        />
      </Row>
      {supportsRadius.includes(element.shape) && (
        <Slider
          label="모서리 둥글기"
          min={0}
          max={Math.round(Math.min(element.width, element.height) / 2)}
          value={element.radius}
          onChange={(radius) => store.updateSelection(() => ({ radius }), { coalesce: 'radius' })}
          format={(value) => `${Math.round(value)}px`}
        />
      )}
    </PanelSection>
  );
};

const ImageSection = ({ element }: { element: Extract<DesignElement, { type: 'image' }> }): ReactElement => {
  const store = useStore();
  const setFilter = (patch: Partial<Extract<DesignElement, { type: 'image' }>['filters']>, coalesce: string): void =>
    store.updateSelection(
      (current) => (current.type === 'image' ? { filters: { ...current.filters, ...patch } } : {}),
      { coalesce },
    );

  return (
    <PanelSection title="이미지">
      <Segmented ariaLabel="맞춤" value={element.fit} options={FIT_OPTIONS} onChange={(fit) => store.updateSelection(() => ({ fit }))} />
      <Slider
        label="모서리 둥글기"
        min={0}
        max={Math.round(Math.min(element.width, element.height) / 2)}
        value={element.radius}
        onChange={(radius) => store.updateSelection(() => ({ radius }), { coalesce: 'image-radius' })}
        format={(value) => `${Math.round(value)}px`}
      />
      <Slider
        label="밝기"
        min={0}
        max={200}
        value={element.filters.brightness}
        onChange={(brightness) => setFilter({ brightness }, 'brightness')}
        format={(value) => `${Math.round(value)}%`}
      />
      <Slider
        label="대비"
        min={0}
        max={200}
        value={element.filters.contrast}
        onChange={(contrast) => setFilter({ contrast }, 'contrast')}
        format={(value) => `${Math.round(value)}%`}
      />
      <Slider
        label="채도"
        min={0}
        max={200}
        value={element.filters.saturate}
        onChange={(saturate) => setFilter({ saturate }, 'saturate')}
        format={(value) => `${Math.round(value)}%`}
      />
      <Slider
        label="흑백"
        min={0}
        max={100}
        value={element.filters.grayscale}
        onChange={(grayscale) => setFilter({ grayscale }, 'grayscale')}
        format={(value) => `${Math.round(value)}%`}
      />
      <Slider
        label="블러"
        min={0}
        max={40}
        value={element.filters.blur}
        onChange={(blur) => setFilter({ blur }, 'blur')}
        format={(value) => `${Math.round(value)}px`}
      />
    </PanelSection>
  );
};

const IconSection = ({ element }: { element: Extract<DesignElement, { type: 'icon' }> }): ReactElement => {
  const store = useStore();
  const { design } = useEditorState();
  return (
    <PanelSection title="아이콘">
      <ColorField
        label="색상"
        value={element.color}
        palette={design.palette}
        onChange={(color) => store.updateSelection(() => ({ color }), { coalesce: 'icon-color' })}
      />
    </PanelSection>
  );
};

const DocumentInspector = (): ReactElement => {
  const store = useStore();
  const { design, activePageId } = useEditorState();
  const page = design.pages.find((candidate) => candidate.id === activePageId) ?? design.pages[0];

  return (
    <>
      <PanelSection title="문서">
        <label className="field">
          <span className="field__label">이름</span>
          <input className="input" value={design.name} onChange={(event) => store.rename(event.target.value)} />
        </label>
        <Row>
          <NumberField label="너비" value={design.width} min={32} max={8000} onChange={(width) => store.resize(width, design.height)} />
          <NumberField label="높이" value={design.height} min={32} max={8000} onChange={(height) => store.resize(design.width, height)} />
        </Row>
      </PanelSection>
      {page && (
        <PanelSection title="페이지">
          <label className="field">
            <span className="field__label">페이지 이름</span>
            <input className="input" value={page.name} onChange={(event) => store.renameActivePage(event.target.value)} />
          </label>
          <PaintEditor
            label="배경"
            paint={page.background}
            palette={design.palette}
            onChange={(background) => store.setBackground(background)}
          />
        </PanelSection>
      )}
      <p className="panel-note">요소를 선택하면 속성이 여기에 표시됩니다.</p>
    </>
  );
};

export const Inspector = (): ReactElement => {
  const store = useStore();
  const { design, selection } = useEditorState();
  const selected = store.selectedElements();
  const primary = selected[0];

  return (
    <aside className="inspector">
      {!primary ? (
        <DocumentInspector />
      ) : (
        <>
          <PanelSection title={selection.length > 1 ? `${selection.length}개 선택` : '배치'}>
            <Row>
              <NumberField label="X" value={primary.x} onChange={(x) => store.updateSelection(() => ({ x }), { coalesce: 'pos-x' })} />
              <NumberField label="Y" value={primary.y} onChange={(y) => store.updateSelection(() => ({ y }), { coalesce: 'pos-y' })} />
            </Row>
            <Row>
              <NumberField
                label="너비"
                value={primary.width}
                min={1}
                onChange={(width) => store.updateSelection(() => ({ width }), { coalesce: 'size-w' })}
              />
              <NumberField
                label="높이"
                value={primary.height}
                min={1}
                onChange={(height) => store.updateSelection(() => ({ height }), { coalesce: 'size-h' })}
              />
            </Row>
            <Row>
              <NumberField
                label="회전"
                value={primary.rotation}
                min={-360}
                max={360}
                suffix="°"
                onChange={(rotation) => store.updateSelection(() => ({ rotation }), { coalesce: 'rotation' })}
              />
              <NumberField
                label="불투명도"
                value={Math.round(primary.opacity * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(value) =>
                  store.updateSelection(() => ({ opacity: Math.max(0, Math.min(1, value / 100)) }), { coalesce: 'opacity' })
                }
              />
            </Row>
            <div className="align-grid" role="group" aria-label="정렬">
              <button type="button" onClick={() => store.align('left')} title="왼쪽 정렬">
                ⇤
              </button>
              <button type="button" onClick={() => store.align('centre-x')} title="가로 가운데">
                ↔
              </button>
              <button type="button" onClick={() => store.align('right')} title="오른쪽 정렬">
                ⇥
              </button>
              <button type="button" onClick={() => store.align('top')} title="위쪽 정렬">
                ⇡
              </button>
              <button type="button" onClick={() => store.align('centre-y')} title="세로 가운데">
                ↕
              </button>
              <button type="button" onClick={() => store.align('bottom')} title="아래쪽 정렬">
                ⇣
              </button>
            </div>
            {selection.length > 2 && (
              <div className="button-row">
                <button type="button" className="button" onClick={() => store.distribute('x')}>
                  가로 균등 분배
                </button>
                <button type="button" className="button" onClick={() => store.distribute('y')}>
                  세로 균등 분배
                </button>
              </div>
            )}
          </PanelSection>

          {primary.type === 'text' && <TextSection element={primary} />}
          {primary.type === 'shape' && <ShapeSection element={primary} />}
          {primary.type === 'image' && <ImageSection element={primary} />}
          {primary.type === 'icon' && <IconSection element={primary} />}

          <PanelSection title="그림자">
            <button
              type="button"
              className={`button button--toggle${primary.shadow.enabled ? ' is-active' : ''}`}
              onClick={() =>
                store.updateSelection((current) => ({ shadow: { ...current.shadow, enabled: !current.shadow.enabled } }))
              }
            >
              {primary.shadow.enabled ? '그림자 켜짐' : '그림자 꺼짐'}
            </button>
            {primary.shadow.enabled && (
              <>
                <ColorField
                  label="그림자 색"
                  value={primary.shadow.color}
                  palette={design.palette}
                  onChange={(color) =>
                    store.updateSelection((current) => ({ shadow: { ...current.shadow, color } }), { coalesce: 'shadow-color' })
                  }
                />
                <Slider
                  label="번짐"
                  min={0}
                  max={200}
                  value={primary.shadow.blur}
                  onChange={(blur) =>
                    store.updateSelection((current) => ({ shadow: { ...current.shadow, blur } }), { coalesce: 'shadow-blur' })
                  }
                  format={(value) => `${Math.round(value)}px`}
                />
                <Row>
                  <NumberField
                    label="X 거리"
                    value={primary.shadow.offsetX}
                    onChange={(offsetX) =>
                      store.updateSelection((current) => ({ shadow: { ...current.shadow, offsetX } }), { coalesce: 'shadow-x' })
                    }
                  />
                  <NumberField
                    label="Y 거리"
                    value={primary.shadow.offsetY}
                    onChange={(offsetY) =>
                      store.updateSelection((current) => ({ shadow: { ...current.shadow, offsetY } }), { coalesce: 'shadow-y' })
                    }
                  />
                </Row>
              </>
            )}
          </PanelSection>

          <PanelSection title="정리">
            <div className="button-row">
              <button type="button" className="button" onClick={() => store.duplicateSelection()}>
                복제
              </button>
              <button type="button" className="button" onClick={() => store.centreSelection()}>
                페이지 중앙
              </button>
              <button
                type="button"
                className="button"
                onClick={() => store.setLocked(selection, !primary.locked)}
              >
                {primary.locked ? '잠금 해제' : '잠금'}
              </button>
              <button type="button" className="button button--danger" onClick={() => store.removeSelection()}>
                삭제
              </button>
            </div>
            {selection.length > 1 && (
              <div className="button-row">
                <button type="button" className="button" onClick={() => store.group()}>
                  그룹
                </button>
                <button type="button" className="button" onClick={() => store.ungroup()}>
                  그룹 해제
                </button>
              </div>
            )}
          </PanelSection>
        </>
      )}
    </aside>
  );
};
