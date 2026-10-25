/**
 * The export sheet.
 *
 * It states exactly what will be produced — format, scale and pixel size —
 * before anything is written, and reports the outcome of every attempt.
 */

import { useState, type ReactElement } from 'react';

import {
  exportJson,
  exportPptx,
  exportRaster,
  exportSvg,
  openPrintView,
} from '../../application/export/exportDesign.js';
import { Segmented } from '../controls.js';
import { useEditorState, useMeasure, useStore } from '../storeContext.js';

type Format = 'png' | 'jpeg' | 'svg' | 'pptx' | 'pdf' | 'json';

const FORMAT_OPTIONS = [
  { value: 'png' as Format, label: 'PNG' },
  { value: 'jpeg' as Format, label: 'JPG' },
  { value: 'svg' as Format, label: 'SVG' },
  { value: 'pptx' as Format, label: 'PPTX' },
  { value: 'pdf' as Format, label: 'PDF' },
  { value: 'json' as Format, label: '파일' },
];

/** Formats written from the whole document rather than a page at a time. */
const WHOLE_DOCUMENT: readonly Format[] = ['pptx', 'pdf', 'json'];

export interface ExportDialogProps {
  readonly onClose: () => void;
}

export const ExportDialog = ({ onClose }: ExportDialogProps): ReactElement => {
  const store = useStore();
  const measure = useMeasure();
  const { design, activePageId } = useEditorState();
  const [format, setFormat] = useState<Format>('png');
  const [scale, setScale] = useState(2);
  const [allPages, setAllPages] = useState(design.pages.length > 1);
  const [busy, setBusy] = useState(false);

  const pages = allPages
    ? design.pages.map((page, index) => ({ page, index }))
    : design.pages
        .map((page, index) => ({ page, index }))
        .filter(({ page }) => page.id === activePageId);

  const run = async (): Promise<void> => {
    setBusy(true);
    try {
      if (format === 'json') {
        const result = exportJson(design);
        if (!result.ok) store.reportError(result.error);
        else store.notify('info', '디자인 파일을 저장했습니다.');
        return;
      }

      if (format === 'pptx') {
        const result = await exportPptx(design, measure, scale);
        if (!result.ok) store.reportError(result.error);
        else store.notify('info', `슬라이드 ${design.pages.length}장을 PPTX로 내보냈습니다.`);
        return;
      }

      if (format === 'pdf') {
        const result = await openPrintView(design, measure);
        if (!result.ok) store.reportError(result.error);
        return;
      }

      for (const { page, index } of pages) {
        if (format === 'svg') {
          const result = exportSvg(design, page, measure, index + 1);
          if (!result.ok) {
            store.reportError(result.error);
            return;
          }
          continue;
        }
        const result = await exportRaster({
          design,
          page,
          measure,
          format,
          scale,
          pageNumber: index + 1,
        });
        if (!result.ok) {
          store.reportError(result.error);
          return;
        }
      }
      store.notify('info', `${pages.length}개 파일을 내보냈습니다.`);
    } catch (cause) {
      store.reportError({
        kind: 'export-failed',
        format: format.toUpperCase(),
        detail: cause instanceof Error ? cause.message : '알 수 없는 오류',
      });
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const raster = format === 'png' || format === 'jpeg';
  // PPTX rasterises its artwork layers, so the same scale applies.
  const usesScale = raster || format === 'pptx';

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="내보내기">
      <div className="sheet">
        <header className="sheet__head">
          <h2>내보내기</h2>
          <button type="button" className="button button--quiet" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <Segmented ariaLabel="형식" value={format} options={FORMAT_OPTIONS} onChange={setFormat} />

        {usesScale && (
          <div className="sheet__row">
            <Segmented
              ariaLabel="배율"
              value={String(scale)}
              options={[
                { value: '1', label: '1×' },
                { value: '2', label: '2×' },
                { value: '3', label: '3×' },
              ]}
              onChange={(value) => setScale(Number(value))}
            />
            <p className="sheet__hint">
              {Math.round(design.width * scale)} × {Math.round(design.height * scale)} px
            </p>
          </div>
        )}

        {design.pages.length > 1 && !WHOLE_DOCUMENT.includes(format) && (
          <label className="checkbox">
            <input type="checkbox" checked={allPages} onChange={(event) => setAllPages(event.target.checked)} />
            모든 페이지 ({design.pages.length}개)
          </label>
        )}

        <p className="sheet__note">
          {format === 'json'
            ? '편집 가능한 디자인 파일로 저장합니다. 홈 화면에서 다시 열 수 있습니다.'
            : format === 'pptx'
              ? `페이지마다 슬라이드 한 장, 총 ${design.pages.length}장. 텍스트는 파워포인트에서 그대로 수정할 수 있고, 도형·이미지·그라디언트는 이미지 레이어로 들어갑니다. 글꼴이 설치되어 있지 않으면 대체 글꼴로 보일 수 있습니다.`
              : format === 'pdf'
                ? '인쇄 창이 열립니다. 대상에서 "PDF로 저장"을 선택하세요.'
                : format === 'svg'
                  ? '벡터로 내보냅니다. 업로드한 이미지는 파일 안에 포함됩니다.'
                  : 'JPG는 투명 배경을 흰색으로 채웁니다.'}
        </p>

        <div className="sheet__actions">
          <button type="button" className="button" onClick={onClose}>
            취소
          </button>
          <button type="button" className="button button--primary" disabled={busy} onClick={() => void run()}>
            {busy ? '내보내는 중…' : '내보내기'}
          </button>
        </div>
      </div>
    </div>
  );
};
