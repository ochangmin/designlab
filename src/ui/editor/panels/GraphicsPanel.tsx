import { useMemo, useState, type ReactElement } from 'react';

import { createImage } from '../../../domain/elements.js';
import {
  GRAPHIC_CATEGORIES,
  GRAPHICS,
  toDataUrl,
  type GraphicAsset,
  type GraphicCategory,
} from '../../../domain/graphics.js';
import { useEditorState, useStore } from '../../storeContext.js';

type Filter = GraphicCategory | '전체';

const FILTERS: readonly Filter[] = ['전체', ...GRAPHIC_CATEGORIES];

/** Tiles are drawn once per asset at a small fixed size. */
const TILE_WIDTH = 132;

export const GraphicsPanel = (): ReactElement => {
  const store = useStore();
  const { design } = useEditorState();
  const [filter, setFilter] = useState<Filter>('전체');

  const thumbnails = useMemo(
    () =>
      new Map(
        GRAPHICS.map((asset) => [
          asset.id,
          toDataUrl(asset.render(TILE_WIDTH, Math.round(TILE_WIDTH / asset.ratio))),
        ]),
      ),
    [],
  );

  const visible = GRAPHICS.filter((asset) => filter === '전체' || asset.category === filter);

  const place = (asset: GraphicAsset): void => {
    // A background covers the page and goes behind everything. Anything else is
    // placed at a workable size in the middle, ready to be moved.
    if (asset.category === '배경') {
      const svg = asset.render(design.width, design.height);
      store.addElements(
        [
          createImage(
            toDataUrl(svg),
            { x: 0, y: 0, width: design.width, height: design.height },
            { name: asset.label, fit: 'fill' },
          ),
        ],
        { sendToBack: true },
      );
      return;
    }

    const width = Math.round(Math.min(design.width, design.height) * (asset.category === '패턴' ? 0.7 : 0.45));
    const height = Math.round(width / asset.ratio);
    store.addElements([
      createImage(
        toDataUrl(asset.render(width, height)),
        {
          x: Math.round((design.width - width) / 2),
          y: Math.round((design.height - height) / 2),
          width,
          height,
        },
        { name: asset.label, fit: 'fill' },
      ),
    ]);
  };

  return (
    <div className="panel">
      <div className="chips">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            className={`chip${filter === name ? ' is-active' : ''}`}
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="panel-grid panel-grid--graphics">
        {visible.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="graphic-tile"
            title={asset.label}
            aria-label={`${asset.label} 추가`}
            onClick={() => place(asset)}
          >
            <img src={thumbnails.get(asset.id)} alt="" draggable={false} />
          </button>
        ))}
      </div>

      <p className="panel-note">
        모든 그래픽은 벡터로 그려지므로 어떤 크기에서도 선명하고, 내보낸 PNG·SVG에도 그대로
        들어갑니다. 배경은 페이지 전체를 덮고 맨 뒤에 놓입니다.
      </p>
    </div>
  );
};
