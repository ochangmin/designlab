/** Document-level actions: identity, history, zoom and export. */

import { useState, type ReactElement } from 'react';

import { useEditorState, useStore } from '../storeContext.js';
import { ExportDialog } from './ExportDialog.js';

const savedLabel = (dirty: boolean, savedAt: number | null): string => {
  if (dirty) return '저장 중…';
  if (savedAt === null) return '저장 안 됨';
  const seconds = Math.round((Date.now() - savedAt) / 1000);
  if (seconds < 60) return '모든 변경 사항 저장됨';
  return `${Math.round(seconds / 60)}분 전 저장됨`;
};

export interface TopBarProps {
  readonly onExit: () => void;
}

export const TopBar = ({ onExit }: TopBarProps): ReactElement => {
  const store = useStore();
  const state = useEditorState();
  const [exporting, setExporting] = useState(false);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="button button--quiet" onClick={onExit} title="홈으로">
          ‹ 홈
        </button>
        <span className="brand__mark brand__mark--small" aria-hidden="true" />
        <input
          className="topbar__name"
          value={state.design.name}
          aria-label="디자인 이름"
          onChange={(event) => store.rename(event.target.value)}
        />
        <span className="topbar__status">
          <span
            className={`topbar__status-dot${state.dirty ? ' topbar__status-dot--pending' : ''}`}
            aria-hidden="true"
          />
          {savedLabel(state.dirty, state.savedAt)}
        </span>
      </div>

      <div className="topbar__centre">
        <button
          type="button"
          className="button button--quiet"
          disabled={!store.canUndo()}
          onClick={() => store.undo()}
          title="되돌리기 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          className="button button--quiet"
          disabled={!store.canRedo()}
          onClick={() => store.redo()}
          title="다시 실행 (Ctrl+Shift+Z)"
        >
          ↷
        </button>
        <span className="topbar__divider" aria-hidden="true" />
        <button type="button" className="button button--quiet" onClick={() => store.zoomBy(1 / 1.2)} title="축소">
          −
        </button>
        <span className="topbar__zoom">{Math.round(state.zoom * 100)}%</span>
        <button type="button" className="button button--quiet" onClick={() => store.zoomBy(1.2)} title="확대">
          +
        </button>
        <button type="button" className="button button--quiet" onClick={() => store.resetView(1)} title="100%">
          1:1
        </button>
      </div>

      <div className="topbar__right">
        <button type="button" className="button" onClick={() => store.addPage()}>
          + 페이지
        </button>
        <button type="button" className="button button--primary" onClick={() => setExporting(true)}>
          내보내기
        </button>
      </div>

      {exporting && <ExportDialog onClose={() => setExporting(false)} />}
    </header>
  );
};
