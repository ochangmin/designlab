/**
 * The project home.
 *
 * Three questions in order: what is this, what do I start from, and what did I
 * already make. Starting points and saved projects live on the same surface
 * because both answer "what am I opening?".
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import type { ProjectSummary } from '../application/projectStore.js';
import { AccountMenu } from './auth/AccountMenu.js';
import { useProjectStore } from './authContext.js';
import { SHAPE_LABELS } from '../domain/elements.js';
import { describeError } from '../domain/errors.js';
import { ICONS } from '../domain/icons.js';
import { openPdfFile } from '../application/format/openPdf.js';
import { openPptxFile } from '../application/format/openPptx.js';
import { parseDesignJson } from '../domain/parse.js';
import type { ImportOutcome } from '../domain/pptxImport.js';
import { FONTS, SIZE_PRESETS } from '../domain/presets.js';
import { createBlankDesign, TEMPLATES } from '../domain/templates.js';
import type { Design } from '../domain/document.js';
import type { MeasureText } from '../domain/textLayout.js';
import { BRAND } from './brand.js';
import { cssVars } from './cssVars.js';
import { Wordmark } from './Wordmark.js';
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

// Counted from the real catalogues, so the numbers cannot drift from what the
// editor actually offers.
const CAPABILITIES: readonly { readonly label: string; readonly value: number }[] = [
  { label: '템플릿', value: TEMPLATES.length },
  { label: '도형', value: Object.keys(SHAPE_LABELS).length },
  { label: '아이콘', value: ICONS.length },
  { label: '글꼴', value: FONTS.length },
];

interface Listing {
  readonly projects: readonly ProjectSummary[];
  readonly notice: string | null;
  readonly loading: boolean;
}

export interface DashboardProps {
  readonly measure: MeasureText;
  readonly onOpen: (design: Design) => void;
  readonly onOpenAuth: () => void;
  readonly onOpenMembers: () => void;
}

export const Dashboard = ({ measure, onOpen, onOpenAuth, onOpenMembers }: DashboardProps): ReactElement => {
  const projectStore = useProjectStore();
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ImportOutcome | null>(null);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const templatesRef = useRef<HTMLElement | null>(null);

  // One read per refresh, and the store it reads from changes with the session:
  // signing in re-runs this against the server without the screen knowing how.
  const [listing, setListing] = useState<Listing>({ projects: [], notice: null, loading: true });
  useEffect(() => {
    let cancelled = false;
    setListing((current) => ({ ...current, loading: true }));
    void projectStore.list().then((result) => {
      if (cancelled) return;
      setListing(
        result.ok
          ? { projects: result.value, notice: null, loading: false }
          : { projects: [], notice: describeError(result.error), loading: false },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [projectStore, refreshToken]);

  const projects = listing.projects;
  const storageNotice = listing.notice;

  const templatePreviews = useMemo(() => TEMPLATES.map((template) => ({ template, design: template.build() })), []);

  const openProject = async (id: string): Promise<void> => {
    const result = await projectStore.load(id);
    if (!result.ok) {
      setMessage(describeError(result.error));
      return;
    }
    onOpen(result.value);
  };

  const removeProject = async (summary: ProjectSummary): Promise<void> => {
    const confirmed = globalThis.confirm(`"${summary.name}"을(를) 삭제할까요? 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    const result = await projectStore.remove(summary.id);
    if (!result.ok) {
      setMessage(describeError(result.error));
      return;
    }
    setRefreshToken((token) => token + 1);
  };

  const importFile = async (file: File): Promise<void> => {
    setMessage(null);
    setPendingImport(null);

    const foreign = /\.pptx?$/i.test(file.name)
      ? openPptxFile
      : /\.pdf$/i.test(file.name)
        ? openPdfFile
        : null;

    if (foreign !== null) {
      const opened = await foreign(file);
      if (!opened.ok) {
        setMessage(describeError(opened.error));
        return;
      }
      // A foreign file can hold things this editor has no equivalent for. Say
      // what will not survive before committing to the conversion, rather than
      // opening a document that quietly lost part of itself.
      if (opened.value.notes.length > 0) {
        setPendingImport(opened.value);
        return;
      }
      onOpen(opened.value.design);
      return;
    }

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
      <header className="topnav">
        <div className="brand">
          <Wordmark withName={false} />
          <div>
            {/* The page's one <h1> belongs to the hero, not the wordmark. */}
            <span className="brand__name">{BRAND.wordmark}</span>
            <p>{BRAND.description}</p>
          </div>
        </div>
        <div className="topnav__actions">
          <label className="button button--ghost">
            디자인 파일 열기
            <input
              type="file"
              accept="application/json,.json,.pptx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
                event.target.value = '';
              }}
            />
          </label>
          <AccountMenu onOpenAuth={onOpenAuth} onOpenMembers={onOpenMembers} />
        </div>
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
      {pendingImport !== null && (
        <div className="banner import-notice" role="status">
          <strong>
            슬라이드 {pendingImport.design.pages.length}장을 읽었습니다. 다음은 이 편집기에서 그대로
            재현되지 않습니다.
          </strong>
          <ul>
            {pendingImport.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <div className="button-row">
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                const outcome = pendingImport;
                setPendingImport(null);
                onOpen(outcome.design);
              }}
            >
              그대로 열기
            </button>
            <button type="button" className="button" onClick={() => setPendingImport(null)}>
              취소
            </button>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <span className="hero__blob hero__blob--a" />
          <span className="hero__blob hero__blob--b" />
          <span className="hero__blob hero__blob--c" />
        </div>
        <div className="hero__content">
          <p className="hero__eyebrow">설치 없이, 브라우저에서</p>
          <h1>
            {BRAND.tagline.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h1>
          <p className="hero__lead">
            템플릿에서 시작하거나 빈 캔버스를 열어 보세요. 작업은 자동으로 저장되고, 화면에 보이는
            그대로 PNG·SVG·PDF로 내보냅니다.
          </p>
          <div className="hero__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => onOpen(createBlankDesign('제목 없는 디자인', 1080, 1080))}
            >
              빈 캔버스로 시작
            </button>
            <button
              type="button"
              className="button"
              onClick={() => templatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              템플릿 둘러보기
            </button>
          </div>
          <dl className="hero__stats">
            {CAPABILITIES.map((capability) => (
              <div key={capability.label} className="hero__stat">
                <dt>{capability.label}</dt>
                <dd>{capability.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="dashboard__section">
        <div className="dashboard__head">
          <h2>새로 만들기</h2>
          <span className="dashboard__count">{SIZE_PRESETS.length}가지 크기</span>
        </div>
        <div className="size-grid">
          {SIZE_PRESETS.map((preset, index) => (
            <button
              key={preset.id}
              type="button"
              className="size-card stagger-item"
              style={cssVars({ '--i': index })}
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
          <div
            className="size-card size-card--custom stagger-item"
            style={cssVars({ '--i': SIZE_PRESETS.length })}
          >
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

      <section className="dashboard__section" ref={templatesRef}>
        <div className="dashboard__head">
          <h2>템플릿</h2>
          <span className="dashboard__count">{TEMPLATES.length}개</span>
        </div>
        <div className="template-grid">
          {templatePreviews.map(({ template, design }, index) => {
            const firstPage = design.pages[0];
            return (
              <button
                key={template.id}
                type="button"
                className="template-card stagger-item"
                style={cssVars({ '--i': index })}
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
                  <span className="template-card__hint">이 템플릿으로 시작</span>
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
        <div className="dashboard__head">
          <h2>내 디자인</h2>
          <span className="dashboard__count">
            {listing.loading ? '불러오는 중…' : projects.length === 0 ? '없음' : `${projects.length}개`}
          </span>
        </div>
        {projects.length === 0 ? (
          <p className="empty">아직 저장된 디자인이 없습니다. 위에서 템플릿이나 크기를 선택해 시작해 보세요.</p>
        ) : (
          <ul className="project-list">
            {projects.map((summary, index) => (
              <li key={summary.id} className="project-row stagger-item" style={cssVars({ '--i': index })}>
                <button type="button" className="project-row__open" onClick={() => void openProject(summary.id)}>
                  <span className="project-row__name">{summary.name}</span>
                  <span className="project-row__meta">
                    {summary.width} × {summary.height} · {summary.pageCount}페이지 · {relativeTime(summary.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => void removeProject(summary)}
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
