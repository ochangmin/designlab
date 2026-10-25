/** The left rail: one tab per insertion source, plus the document's own panels. */

import { useState, type ReactElement } from 'react';

import { cssVars } from '../cssVars.js';
import { BackgroundPanel } from './panels/BackgroundPanel.js';
import { ElementsPanel } from './panels/ElementsPanel.js';
import { GraphicsPanel } from './panels/GraphicsPanel.js';
import { LayersPanel } from './panels/LayersPanel.js';
import { TemplatesPanel } from './panels/TemplatesPanel.js';
import { TextPanel } from './panels/TextPanel.js';
import { UploadsPanel } from './panels/UploadsPanel.js';

type TabId = 'templates' | 'elements' | 'graphics' | 'text' | 'uploads' | 'background' | 'layers';

interface Tab {
  readonly id: TabId;
  readonly label: string;
  readonly glyph: string;
}

const TABS: readonly Tab[] = [
  { id: 'templates', label: '템플릿', glyph: '▦' },
  { id: 'elements', label: '요소', glyph: '◇' },
  { id: 'graphics', label: '그래픽', glyph: '✦' },
  { id: 'text', label: '텍스트', glyph: 'T' },
  { id: 'uploads', label: '업로드', glyph: '↑' },
  { id: 'background', label: '배경', glyph: '◧' },
  { id: 'layers', label: '레이어', glyph: '≡' },
];

const panelFor = (tab: TabId): ReactElement => {
  switch (tab) {
    case 'templates':
      return <TemplatesPanel />;
    case 'elements':
      return <ElementsPanel />;
    case 'graphics':
      return <GraphicsPanel />;
    case 'text':
      return <TextPanel />;
    case 'uploads':
      return <UploadsPanel />;
    case 'background':
      return <BackgroundPanel />;
    case 'layers':
      return <LayersPanel />;
  }
};

export const LeftRail = (): ReactElement => {
  const [active, setActive] = useState<TabId>('templates');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`left-rail${collapsed ? ' left-rail--collapsed' : ''}`}>
      <nav className="rail" aria-label="도구">
        {/* The pill is positioned from the active index; motion.css slides it. */}
        <span
          className="rail__indicator"
          aria-hidden="true"
          style={cssVars({ '--active-tab': TABS.findIndex((tab) => tab.id === active) })}
        />
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rail__tab${active === tab.id && !collapsed ? ' is-active' : ''}`}
            onClick={() => {
              if (active === tab.id) {
                setCollapsed((value) => !value);
                return;
              }
              setActive(tab.id);
              setCollapsed(false);
            }}
            aria-pressed={active === tab.id && !collapsed}
          >
            <span className="rail__glyph" aria-hidden="true">
              {tab.glyph}
            </span>
            <span className="rail__label">{tab.label}</span>
          </button>
        ))}
      </nav>
      {!collapsed && (
        <div className="rail-panel">
          <header className="rail-panel__head">
            <h2>{TABS.find((tab) => tab.id === active)?.label}</h2>
            <button type="button" className="button button--quiet" onClick={() => setCollapsed(true)} aria-label="패널 닫기">
              ‹
            </button>
          </header>
          {/* Keyed by tab so switching panels replays the slide-in. */}
          <div key={active} className="rail-panel__body">
            {panelFor(active)}
          </div>
        </div>
      )}
    </div>
  );
};
