import type { ReactElement } from 'react';

import { ELEMENT_TYPE_LABELS } from '../../../domain/elements.js';
import type { DesignElement } from '../../../domain/document.js';
import { PanelSection } from '../../controls.js';
import { useEditorState, useStore } from '../../storeContext.js';

const describe = (element: DesignElement): string => {
  if (element.type === 'text') {
    const firstLine = element.text.split('\n')[0] ?? '';
    return firstLine.trim() === '' ? '빈 텍스트' : firstLine.slice(0, 28);
  }
  return element.name;
};

export const LayersPanel = (): ReactElement => {
  const store = useStore();
  const { design, activePageId, selection } = useEditorState();
  const page = design.pages.find((candidate) => candidate.id === activePageId) ?? design.pages[0];

  if (!page) return <div className="panel" />;

  // Top of the list is the front of the page, which is how people read depth.
  const ordered = [...page.elements].reverse();

  return (
    <div className="panel">
      <PanelSection title={`레이어 (${ordered.length})`}>
        {ordered.length === 0 ? (
          <p className="panel-note">이 페이지에는 아직 요소가 없습니다.</p>
        ) : (
          <ul className="layer-list">
            {ordered.map((element) => {
              const selected = selection.includes(element.id);
              return (
                <li key={element.id} className={`layer-row${selected ? ' is-selected' : ''}`}>
                  <button type="button" className="layer-row__main" onClick={() => store.select([element.id])}>
                    <span className="layer-row__type">{ELEMENT_TYPE_LABELS[element.type]}</span>
                    <span className="layer-row__name">{describe(element)}</span>
                  </button>
                  <span className="layer-row__actions">
                    <button
                      type="button"
                      title={element.hidden ? '보이기' : '숨기기'}
                      aria-label={element.hidden ? '보이기' : '숨기기'}
                      onClick={() => store.setHidden([element.id], !element.hidden)}
                    >
                      {element.hidden ? '◻' : '◼'}
                    </button>
                    <button
                      type="button"
                      title={element.locked ? '잠금 해제' : '잠금'}
                      aria-label={element.locked ? '잠금 해제' : '잠금'}
                      onClick={() => store.setLocked([element.id], !element.locked)}
                    >
                      {element.locked ? '🔒' : '🔓'}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </PanelSection>

      {selection.length > 0 && (
        <PanelSection title="순서">
          <div className="button-row">
            <button type="button" className="button" onClick={() => store.reorderSelection('front')}>
              맨 앞으로
            </button>
            <button type="button" className="button" onClick={() => store.reorderSelection('forward')}>
              앞으로
            </button>
            <button type="button" className="button" onClick={() => store.reorderSelection('backward')}>
              뒤로
            </button>
            <button type="button" className="button" onClick={() => store.reorderSelection('back')}>
              맨 뒤로
            </button>
          </div>
        </PanelSection>
      )}
    </div>
  );
};
