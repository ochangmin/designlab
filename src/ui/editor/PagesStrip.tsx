/** The page strip: ordering, duplication and navigation for multi-page documents. */

import type { ReactElement } from 'react';

import { useEditorState, useMeasure, useStore } from '../storeContext.js';
import { PagePreview } from '../PagePreview.js';

export const PagesStrip = (): ReactElement => {
  const store = useStore();
  const measure = useMeasure();
  const { design, activePageId } = useEditorState();

  return (
    <footer className="pages-strip">
      <div className="pages-strip__list">
        {design.pages.map((page, index) => (
          <div key={page.id} className={`page-chip${page.id === activePageId ? ' is-active' : ''}`}>
            <button type="button" className="page-chip__thumb" onClick={() => store.selectPage(page.id)}>
              <PagePreview design={design} page={page} measure={measure} width={72} />
            </button>
            <span className="page-chip__label">{index + 1}</span>
          </div>
        ))}
        <button type="button" className="page-chip page-chip--add" onClick={() => store.addPage()} aria-label="페이지 추가">
          +
        </button>
      </div>

      <div className="pages-strip__actions">
        <button type="button" className="button button--quiet" onClick={() => store.moveActivePage(-1)} title="앞으로 이동">
          ‹
        </button>
        <button type="button" className="button button--quiet" onClick={() => store.moveActivePage(1)} title="뒤로 이동">
          ›
        </button>
        <button type="button" className="button button--quiet" onClick={() => store.duplicateActivePage()}>
          페이지 복제
        </button>
        <button type="button" className="button button--quiet" onClick={() => store.removeActivePage()}>
          페이지 삭제
        </button>
      </div>
    </footer>
  );
};
