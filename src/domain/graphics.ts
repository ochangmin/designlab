/**
 * The built-in graphics library.
 *
 * Every asset is drawn by code into an SVG document rather than shipped as a
 * bitmap. Three things follow from that: the library costs no third-party
 * content and no licence, it stays sharp at any page size, and an asset placed
 * on the canvas is an ordinary image element, so the raster and SVG exporters
 * already know how to draw it.
 *
 * `render` returns a standalone SVG sized to the box it was asked for. The
 * markup carries no external reference, which is what lets `new Image()` load
 * it from a data URL without tainting the export canvas.
 */

export type GraphicCategory = '배경' | '패턴' | '도형' | '프레임';

export interface GraphicAsset {
  readonly id: string;
  readonly label: string;
  readonly category: GraphicCategory;
  /** Width ÷ height the asset is drawn for; the panel and insert size follow it. */
  readonly ratio: number;
  readonly render: (width: number, height: number) => string;
}

/** An SVG document as a data URL, safe to use as an image source. */
export const toDataUrl = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const document_ = (width: number, height: number, body: string, defs = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  `${defs === '' ? '' : `<defs>${defs}</defs>`}${body}</svg>`;

interface Palette {
  readonly id: string;
  readonly label: string;
  readonly colors: readonly [string, string, string, string];
}

const PALETTES: readonly Palette[] = [
  { id: 'indigo', label: '인디고', colors: ['#0b1021', '#6d5efc', '#f472b6', '#facc15'] },
  { id: 'sunset', label: '선셋', colors: ['#2b1331', '#e2456b', '#ff9f68', '#ffe3b0'] },
  { id: 'ocean', label: '오션', colors: ['#06212e', '#13a3b5', '#8be0e6', '#d7f7fa'] },
  { id: 'forest', label: '포레스트', colors: ['#10231c', '#3f9a6a', '#9fd8b4', '#ecf8f0'] },
];

// ------------------------------------------------------------- backgrounds

/** Soft overlapping light sources, blurred into one another. */
const aurora = (palette: Palette) => (width: number, height: number): string => {
  const [base, one, two, three] = palette.colors;
  const blur = Math.round(Math.min(width, height) * 0.22);
  const circle = (cx: number, cy: number, r: number, fill: string, opacity: number): string =>
    `<circle cx="${(width * cx).toFixed(1)}" cy="${(height * cy).toFixed(1)}" r="${(Math.min(width, height) * r).toFixed(1)}" fill="${fill}" opacity="${opacity}"/>`;
  return document_(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="${base}"/>` +
      `<g filter="url(#soften)">${circle(0.25, 0.3, 0.42, one, 0.85)}${circle(0.78, 0.22, 0.34, two, 0.8)}${circle(0.6, 0.85, 0.38, three, 0.65)}</g>`,
    `<filter id="soften" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur}"/></filter>`,
  );
};

/** Four corner tints meeting in the middle. */
const mesh = (palette: Palette) => (width: number, height: number): string => {
  const [base, one, two, three] = palette.colors;
  const stop = (id: string, colour: string): string =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${colour}" stop-opacity="0.95"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient>`;
  const spot = (id: string, cx: number, cy: number, r: number): string =>
    `<ellipse cx="${(width * cx).toFixed(1)}" cy="${(height * cy).toFixed(1)}" rx="${(width * r).toFixed(1)}" ry="${(height * r).toFixed(1)}" fill="url(#${id})"/>`;
  return document_(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="${base}"/>${spot('m1', 0.1, 0.12, 0.6)}${spot('m2', 0.92, 0.18, 0.5)}${spot('m3', 0.2, 0.9, 0.55)}${spot('m4', 0.85, 0.88, 0.45)}`,
    `${stop('m1', one)}${stop('m2', two)}${stop('m3', three)}${stop('m4', one)}`,
  );
};

/** Layered hills, the shape most often wanted behind a headline. */
const dunes = (palette: Palette) => (width: number, height: number): string => {
  const [base, one, two, three] = palette.colors;
  const hill = (top: number, fill: string): string => {
    const y = height * top;
    return `<path d="M0 ${y.toFixed(1)} C ${(width * 0.3).toFixed(1)} ${(y - height * 0.12).toFixed(1)}, ${(width * 0.68).toFixed(1)} ${(y + height * 0.1).toFixed(1)}, ${width} ${(y - height * 0.04).toFixed(1)} L ${width} ${height} L 0 ${height} Z" fill="${fill}"/>`;
  };
  return document_(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="${base}"/>${hill(0.52, three)}${hill(0.68, two)}${hill(0.84, one)}`,
  );
};

/** A dark field with a scatter of light points. */
const starfield = (palette: Palette) => (width: number, height: number): string => {
  const [base, one, , three] = palette.colors;
  const points: string[] = [];
  // A fixed lattice with a deterministic offset: the same asset every time.
  for (let row = 0; row < 14; row += 1) {
    for (let column = 0; column < 20; column += 1) {
      const jitter = ((row * 31 + column * 17) % 11) / 11;
      const size = 0.6 + ((row * 7 + column * 13) % 5) * 0.5;
      const x = ((column + jitter) / 20) * width;
      const y = ((row + ((column * 5) % 7) / 7) / 14) * height;
      const opacity = 0.25 + ((row + column) % 4) * 0.2;
      points.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size * Math.min(width, height)) / 420}" fill="${three}" opacity="${opacity.toFixed(2)}"/>`,
      );
    }
  }
  return document_(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="url(#sky)"/>${points.join('')}`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${one}" stop-opacity="0.7"/></linearGradient>`,
  );
};

// ---------------------------------------------------------------- patterns

const tile = (
  id: string,
  size: number,
  content: string,
  width: number,
  height: number,
  background: string,
): string =>
  document_(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="${background}"/><rect width="${width}" height="${height}" fill="url(#${id})"/>`,
    `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${content}</pattern>`,
  );

const dots = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(12, Math.round(Math.min(width, height) / 14));
  return tile(
    'dots',
    size,
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 7}" fill="${ink}"/>`,
    width,
    height,
    background,
  );
};

const grid = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(16, Math.round(Math.min(width, height) / 12));
  return tile(
    'grid',
    size,
    `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${ink}" stroke-width="${Math.max(1, size / 24)}"/>`,
    width,
    height,
    background,
  );
};

const stripes = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(14, Math.round(Math.min(width, height) / 13));
  return tile(
    'stripes',
    size,
    `<path d="M -${size} ${size} L ${size} -${size} M 0 ${size * 2} L ${size * 2} 0" stroke="${ink}" stroke-width="${size / 3}"/>`,
    width,
    height,
    background,
  );
};

const chevron = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(18, Math.round(Math.min(width, height) / 10));
  return tile(
    'chev',
    size,
    `<path d="M0 ${size * 0.7} L ${size / 2} ${size * 0.25} L ${size} ${size * 0.7}" fill="none" stroke="${ink}" stroke-width="${size / 7}"/>`,
    width,
    height,
    background,
  );
};

const triangles = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(20, Math.round(Math.min(width, height) / 9));
  return tile(
    'tri',
    size,
    `<path d="M0 ${size} L ${size / 2} 0 L ${size} ${size} Z" fill="${ink}" opacity="0.9"/>`,
    width,
    height,
    background,
  );
};

const crosses = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(18, Math.round(Math.min(width, height) / 11));
  const arm = size / 5;
  return tile(
    'cross',
    size,
    `<path d="M ${size / 2 - arm} ${size / 2} h ${arm * 2} M ${size / 2} ${size / 2 - arm} v ${arm * 2}" stroke="${ink}" stroke-width="${Math.max(1, size / 14)}" stroke-linecap="round"/>`,
    width,
    height,
    background,
  );
};

const waves = (ink: string, background: string) => (width: number, height: number): string => {
  const size = Math.max(24, Math.round(Math.min(width, height) / 8));
  return tile(
    'wave',
    size,
    `<path d="M0 ${size * 0.6} q ${size * 0.25} -${size * 0.35} ${size * 0.5} 0 q ${size * 0.25} ${size * 0.35} ${size * 0.5} 0" fill="none" stroke="${ink}" stroke-width="${size / 9}" stroke-linecap="round"/>`,
    width,
    height,
    background,
  );
};

// ------------------------------------------------------------------ shapes

const blob = (seed: number, fill: string) => (width: number, height: number): string => {
  // A closed curve through eight points whose radii vary deterministically.
  const points = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2;
    const radius = 0.34 + (((index * seed) % 5) / 5) * 0.14;
    return [0.5 + Math.cos(angle) * radius, 0.5 + Math.sin(angle) * radius] as const;
  });
  const path = points
    .map(([x, y], index) => {
      const point = `${(x * width).toFixed(1)} ${(y * height).toFixed(1)}`;
      if (index === 0) return `M ${point}`;
      const previous = points[index - 1] ?? points[0];
      const controlX = (((previous?.[0] ?? 0) + x) / 2) * width;
      const controlY = (((previous?.[1] ?? 0) + y) / 2) * height;
      return `Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${point}`;
    })
    .join(' ');
  return document_(width, height, `<path d="${path} Z" fill="${fill}"/>`);
};

const burst = (spokes: number, fill: string) => (width: number, height: number): string => {
  const path = Array.from({ length: spokes * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? 0.48 : 0.19;
    const angle = (index / (spokes * 2)) * Math.PI * 2 - Math.PI / 2;
    return `${((0.5 + Math.cos(angle) * radius) * width).toFixed(1)} ${((0.5 + Math.sin(angle) * radius) * height).toFixed(1)}`;
  }).join(' L ');
  return document_(width, height, `<path d="M ${path} Z" fill="${fill}"/>`);
};

const ring = (fill: string, thickness: number) => (width: number, height: number): string =>
  document_(
    width,
    height,
    `<circle cx="${width / 2}" cy="${height / 2}" r="${(Math.min(width, height) / 2) * (1 - thickness / 2)}" fill="none" stroke="${fill}" stroke-width="${Math.min(width, height) * thickness}"/>`,
  );

const arc = (fill: string) => (width: number, height: number): string =>
  document_(
    width,
    height,
    `<path d="M 0 ${height} A ${width / 2} ${height} 0 0 1 ${width} ${height} Z" fill="${fill}"/>`,
  );

const squiggle = (ink: string) => (width: number, height: number): string => {
  const step = width / 4;
  return document_(
    width,
    height,
    `<path d="M 0 ${height / 2} q ${step / 2} -${height / 2.2} ${step} 0 q ${step / 2} ${height / 2.2} ${step} 0 q ${step / 2} -${height / 2.2} ${step} 0 q ${step / 2} ${height / 2.2} ${step} 0" fill="none" stroke="${ink}" stroke-width="${height / 7}" stroke-linecap="round"/>`,
  );
};

const sparkle = (fill: string) => (width: number, height: number): string =>
  document_(
    width,
    height,
    `<path d="M ${width / 2} 0 C ${width * 0.55} ${height * 0.35}, ${width * 0.65} ${height * 0.45}, ${width} ${height / 2} C ${width * 0.65} ${height * 0.55}, ${width * 0.55} ${height * 0.65}, ${width / 2} ${height} C ${width * 0.45} ${height * 0.65}, ${width * 0.35} ${height * 0.55}, 0 ${height / 2} C ${width * 0.35} ${height * 0.45}, ${width * 0.45} ${height * 0.35}, ${width / 2} 0 Z" fill="${fill}"/>`,
  );

const quoteMark = (fill: string) => (width: number, height: number): string => {
  const unit = Math.min(width, height);
  const mark = (offset: number): string =>
    `<path d="M ${offset} ${height} C ${offset} ${height * 0.45}, ${offset + unit * 0.1} ${height * 0.1}, ${offset + unit * 0.42} 0 L ${offset + unit * 0.42} ${height * 0.3} C ${offset + unit * 0.22} ${height * 0.5}, ${offset + unit * 0.2} ${height * 0.72}, ${offset + unit * 0.3} ${height} Z" fill="${fill}"/>`;
  return document_(width, height, `${mark(0)}${mark(unit * 0.52)}`);
};

// ------------------------------------------------------------------ frames

const photoFrame = (fill: string, radius: number) => (width: number, height: number): string =>
  document_(
    width,
    height,
    `<rect x="${width * 0.04}" y="${height * 0.04}" width="${width * 0.92}" height="${height * 0.92}" rx="${Math.min(width, height) * radius}" fill="${fill}"/>` +
      `<path d="M ${width * 0.16} ${height * 0.72} L ${width * 0.38} ${height * 0.45} L ${width * 0.56} ${height * 0.66} L ${width * 0.68} ${height * 0.54} L ${width * 0.86} ${height * 0.78} Z" fill="rgba(255,255,255,0.45)"/>` +
      `<circle cx="${width * 0.7}" cy="${height * 0.28}" r="${Math.min(width, height) * 0.07}" fill="rgba(255,255,255,0.6)"/>`,
  );

const polaroid = (fill: string) => (width: number, height: number): string =>
  document_(
    width,
    height,
    `<rect width="${width}" height="${height}" rx="${Math.min(width, height) * 0.03}" fill="#ffffff"/>` +
      `<rect x="${width * 0.07}" y="${width * 0.07}" width="${width * 0.86}" height="${height - width * 0.3}" fill="${fill}"/>`,
  );

const filmStrip = (ink: string) => (width: number, height: number): string => {
  const holes: string[] = [];
  const count = 8;
  const holeWidth = width / (count * 2);
  for (let index = 0; index < count; index += 1) {
    const x = holeWidth * (index * 2 + 0.5);
    holes.push(
      `<rect x="${x.toFixed(1)}" y="${(height * 0.06).toFixed(1)}" width="${holeWidth.toFixed(1)}" height="${(height * 0.1).toFixed(1)}" rx="${(holeWidth / 4).toFixed(1)}" fill="#ffffff"/>`,
      `<rect x="${x.toFixed(1)}" y="${(height * 0.84).toFixed(1)}" width="${holeWidth.toFixed(1)}" height="${(height * 0.1).toFixed(1)}" rx="${(holeWidth / 4).toFixed(1)}" fill="#ffffff"/>`,
    );
  }
  return document_(width, height, `<rect width="${width}" height="${height}" fill="${ink}"/>${holes.join('')}`);
};

// ----------------------------------------------------------------- catalogue

const backgroundAssets: readonly GraphicAsset[] = PALETTES.flatMap((palette) => [
  { id: `aurora-${palette.id}`, label: `오로라 · ${palette.label}`, category: '배경' as const, ratio: 1, render: aurora(palette) },
  { id: `mesh-${palette.id}`, label: `메시 · ${palette.label}`, category: '배경' as const, ratio: 1, render: mesh(palette) },
  { id: `dunes-${palette.id}`, label: `언덕 · ${palette.label}`, category: '배경' as const, ratio: 1, render: dunes(palette) },
  { id: `stars-${palette.id}`, label: `별밤 · ${palette.label}`, category: '배경' as const, ratio: 1, render: starfield(palette) },
]);

const patternAssets: readonly GraphicAsset[] = [
  { id: 'dots-ink', label: '도트', category: '패턴', ratio: 1, render: dots('#111827', '#f4f4f5') },
  { id: 'dots-violet', label: '도트 · 바이올렛', category: '패턴', ratio: 1, render: dots('#6d5efc', '#eeecff') },
  { id: 'grid-ink', label: '그리드', category: '패턴', ratio: 1, render: grid('rgba(17,24,39,0.22)', '#ffffff') },
  { id: 'grid-teal', label: '그리드 · 틸', category: '패턴', ratio: 1, render: grid('rgba(19,163,181,0.35)', '#eefcfd') },
  { id: 'stripes-ink', label: '사선', category: '패턴', ratio: 1, render: stripes('rgba(17,24,39,0.12)', '#fafaf7') },
  { id: 'stripes-pink', label: '사선 · 핑크', category: '패턴', ratio: 1, render: stripes('rgba(244,114,182,0.4)', '#fff5fa') },
  { id: 'chevron', label: '셰브론', category: '패턴', ratio: 1, render: chevron('rgba(109,94,252,0.5)', '#f4f5ff') },
  { id: 'triangles', label: '삼각', category: '패턴', ratio: 1, render: triangles('rgba(250,204,21,0.75)', '#fffbeb') },
  { id: 'crosses', label: '크로스', category: '패턴', ratio: 1, render: crosses('rgba(17,24,39,0.35)', '#ffffff') },
  { id: 'waves', label: '물결', category: '패턴', ratio: 1, render: waves('rgba(14,165,233,0.55)', '#f0f9ff') },
];

const shapeAssets: readonly GraphicAsset[] = [
  { id: 'blob-1', label: '블롭 1', category: '도형', ratio: 1, render: blob(3, '#6d5efc') },
  { id: 'blob-2', label: '블롭 2', category: '도형', ratio: 1, render: blob(7, '#f472b6') },
  { id: 'blob-3', label: '블롭 3', category: '도형', ratio: 1, render: blob(11, '#13a3b5') },
  { id: 'burst-12', label: '버스트', category: '도형', ratio: 1, render: burst(12, '#facc15') },
  { id: 'burst-24', label: '버스트 24', category: '도형', ratio: 1, render: burst(24, '#ff9f68') },
  { id: 'ring-thin', label: '링', category: '도형', ratio: 1, render: ring('#6d5efc', 0.1) },
  { id: 'ring-thick', label: '두꺼운 링', category: '도형', ratio: 1, render: ring('#111827', 0.26) },
  { id: 'arc', label: '아치', category: '도형', ratio: 1.6, render: arc('#3f9a6a') },
  { id: 'squiggle', label: '물결선', category: '도형', ratio: 3, render: squiggle('#f472b6') },
  { id: 'sparkle', label: '반짝임', category: '도형', ratio: 1, render: sparkle('#facc15') },
  { id: 'quote', label: '따옴표', category: '도형', ratio: 1.3, render: quoteMark('#d4d4d8') },
];

const frameAssets: readonly GraphicAsset[] = [
  { id: 'frame-soft', label: '사진 자리', category: '프레임', ratio: 4 / 3, render: photoFrame('#c7cdf2', 0.06) },
  { id: 'frame-round', label: '둥근 사진 자리', category: '프레임', ratio: 1, render: photoFrame('#bae6fd', 0.5) },
  { id: 'polaroid', label: '폴라로이드', category: '프레임', ratio: 4 / 5, render: polaroid('#e9d5ff') },
  { id: 'film', label: '필름', category: '프레임', ratio: 3, render: filmStrip('#1b1b1f') },
];

export const GRAPHICS: readonly GraphicAsset[] = [
  ...backgroundAssets,
  ...patternAssets,
  ...shapeAssets,
  ...frameAssets,
];

export const GRAPHIC_CATEGORIES: readonly GraphicCategory[] = ['배경', '패턴', '도형', '프레임'];

export const findGraphic = (id: string): GraphicAsset | null =>
  GRAPHICS.find((asset) => asset.id === id) ?? null;
