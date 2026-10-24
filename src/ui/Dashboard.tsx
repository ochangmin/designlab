/**
 * The project home.
 *
 * Starting points (sizes and templates) and the person's saved projects live
 * side by side, because both answer the same question: what am I opening?
 */

import { useMemo, useState, type ReactElement } from 'react';

import { createBlankDesign } from '../domain/templates.js';
import { describeError } from '../domain/errors.js';
import { SIZE_PRESETS } from '../domain/presets.js';
import { TEMPLATES } from '../domain/templates.js';
import type { Design } from '../domain/document.js';
import type { MeasureText } from '../domain/textLayout.js';
import { deleteProject, listProjects, loadProject, type ProjectSummary } from '../application/projectRepository.js';
import { parseDesignJson } from '../domain/parse.js';
import { PagePreview } from './PagePreview.js';

const relativeTime = (timestamp: number): string => {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR');
};

export interface DashboardProps {
  readonly measure: MeasureText;
  readonly onOpen: (design: Design) => void;
}

export const Dashboard = ({ measure, onOpen }: DashboardProps): ReactElement => {
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);

  // One read of the repository per refresh: the list and the storage notice are
  // two views of the same outcome, not two lookups.
  const stored = useMemo(() => {
    void refreshToken;
    return listProjects();
  }, [refreshToken]);
  const projects: readonly ProjectSummary[] = stored.ok ? stored.value : [];
  const storageNotice = stored.ok ? null : describeError(stored.error);

  const templatePreviews = useMemo(() => TEMPLATES.map((template) => ({ template, design: template.build() })), []);

  const openProject = (id: string): void => {
    const result = loadProject(id);
    if (!result.ok) {
      setMessage(describeError(result.error));
      return;
    }
    onOpen(result.value);
  };

  const removeProject = (summary: ProjectSummary): void => {
    const confirmed = globalThis.confirm(`"${summary.name}"을(를) 삭제할까요? 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    const result = deleteProject(summary.id);
    if (!result.ok) {
      setMessage(describeError(result.error));
      return;
    }
    setRefreshToken((token) => token + 1);
  };

  const importFile = async (file: File): Promise<void> => {
    const text = await file.text();
    const parsed = parseDesignJson(text);
    if (!parsed.ok) {
      setMessage(describeError(parsed.error));
      return;
    }
    onOpen(parsed.value);
  };

  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <h1>DesignLab</h1>
            <p>브라우저에서 바로 만드는 디자인 플랫폼</p>
          </div>
        </div>
        <label className="button button--ghost">
          디자인 파일 열기
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = '';
            }}
          />
        </label>
      </header>

      {message !== null && (
        <p className="banner banner--error" role="status">
          {message}
        </p>
      )}
      {storageNotice !== null && (
        <p className="banner" role="status">
          {storageNotice}
        </p>
      )}

      <section className="dashboard__section">
        <h2>새로 만들기</h2>
        <div className="size-grid">
          {SIZE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="size-card"
              onClick={() => onOpen(createBlankDesign(preset.label, preset.width, preset.height))}
            >
              <span
                className="size-card__shape"
                style={{
                  aspectRatio: `${preset.width} / ${preset.height}`,
                  maxWidth: '72px',
                  maxHeight: '72px',
                }}
              />
              <strong>{preset.label}</strong>
              <small>{preset.hint}</small>
            </button>
          ))}
          <div className="size-card size-card--custom">
            <strong>직접 입력</strong>
            <div className="size-card__inputs">
              <input
                type="number"
                min={32}
                max={8000}
                value={customWidth}
                onChange={(event) => setCustomWidth(Number(event.target.value))}
                aria-label="너비"
              />
              <span>×</span>
              <input
                type="number"
                min={32}
                max={8000}
                value={customHeight}
                onChange={(event) => setCustomHeight(Number(event.target.value))}
                aria-label="높이"
              />
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                onOpen(
                  createBlankDesign(
                    `${customWidth} × ${customHeight}`,
                    Math.max(32, customWidth),
                    Math.max(32, customHeight),
                  ),
                )
              }
            >
              만들기
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard__section">
        <h2>템플릿</h2>
        <div className="template-grid">
          {templatePreviews.map(({ template, design }) => {
            const firstPage = design.pages[0];
            return (
              <button
                key={template.id}
                type="button"
                className="template-card"
                onClick={() => onOpen(template.build())}
              >
                <div className="template-card__canvas">
                  {firstPage && (
                    <PagePreview
                      design={design}
                      page={firstPage}
                      measure={measure}
                      // Fit inside the card: portrait documents are limited by
                      // height, landscape ones by width.
                      width={Math.min(240, (196 * design.width) / design.height)}
                    />
                  )}
                </div>
                <div className="template-card__meta">
                  <strong>{template.label}</strong>
                  <small>{template.category}</small>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard__section">
        <h2>내 디자인</h2>
        {projects.length === 0 ? (
          <p className="empty">아직 저장된 디자인이 없습니다. 위에서 템플릿이나 크기를 선택해 시작해 보세요.</p>
        ) : (
          <ul className="project-list">
            {projects.map((summary) => (
              <li key={summary.id} className="project-row">
                <button type="button" className="project-row__open" onClick={() => openProject(summary.id)}>
                  <span className="project-row__name">{summary.name}</span>
                  <span className="project-row__meta">
                    {summary.width} × {summary.height} · {summary.pageCount}페이지 · {relativeTime(summary.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => removeProject(summary)}
                  aria-label={`${summary.name} 삭제`}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
