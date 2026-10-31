/**
 * The brand, as data.
 *
 * One owner for every brand-bearing fact — the name, the mark, the palette,
 * the typeface stack, the voice — so that changing the brand is editing this
 * file and nothing else. No component writes a brand colour or spells the
 * product name itself.
 *
 * This exists in this shape for a specific reason: the product is meant to be
 * folded into BIPKO (bipko.ai) later. That merge is a change of which `Brand`
 * is active, not a refactor, because the palette below is already BIPKO's and
 * the token vocabulary lines up with the one that site uses.
 */

export type BrandId = 'studio' | 'bipko';

export interface BrandPalette {
  /** The one colour people remember. */
  readonly primary: string;
  readonly primaryInk: string;
  /** A tint of `primary`, for selected and hovered states. */
  readonly primarySoft: string;
  /** The dark ground that marketing surfaces sit on. */
  readonly deep: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly inkFaint: string;
  readonly line: string;
  readonly lineStrong: string;
  readonly surface: string;
  readonly surfaceSunken: string;
  /** Behind the page in the editor, so the artwork reads as the lit thing. */
  readonly workspace: string;
}

export interface BrandType {
  /** Matches bipko.ai exactly, Korean and Japanese fallbacks included. */
  readonly stack: string;
  readonly displayWeight: number;
  /** Corner radius in px. bipko.ai uses 0.625rem; this is the same value. */
  readonly radius: number;
}

export interface BrandMark {
  /** Path data on a 32-unit grid, drawn in `primaryInk` over the tile. */
  readonly glyph: string;
  /** The tile behind the glyph, as CSS. */
  readonly tile: string;
}

export interface Brand {
  readonly id: BrandId;
  /** What the product is called in full, e.g. in the browser title. */
  readonly name: string;
  /** The word that stands alone next to the mark. */
  readonly wordmark: string;
  /** The house this product belongs to, or `null` when it stands alone. */
  readonly house: string | null;
  readonly houseUrl: string | null;
  /** One entry per line; the brand owns where the headline breaks. */
  readonly tagline: readonly string[];
  readonly description: string;
  readonly palette: BrandPalette;
  readonly type: BrandType;
  readonly mark: BrandMark;
}

/**
 * Read from bipko.ai: the pink it signs everything with, the indigo its hero
 * sits on, and the greys its text uses. Keeping these exact is what makes the
 * two surfaces look like one product on the day they are joined.
 */
const BIPKO_PINK = '#fa168b';
const BIPKO_DEEP = '#100b2b';
const BIPKO_INK = '#171431';
const BIPKO_INK_SOFT = '#6b687b';

const SHARED_TYPE: BrandType = {
  stack: 'Inter, "Noto Sans KR", "Noto Sans JP", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  displayWeight: 800,
  radius: 10,
};

const SHARED_PALETTE: BrandPalette = {
  primary: BIPKO_PINK,
  primaryInk: '#ffffff',
  primarySoft: '#ffe9f4',
  deep: BIPKO_DEEP,
  ink: BIPKO_INK,
  inkSoft: BIPKO_INK_SOFT,
  inkFaint: '#9a97a8',
  line: '#e6e4ef',
  lineStrong: '#cfccdd',
  surface: '#ffffff',
  surfaceSunken: '#f6f5fa',
  workspace: '#ebe9f3',
};

/**
 * The mark: a frame with one corner turned up — a page being laid out — and a
 * spark at its shoulder. Drawn here rather than shipped as a file so it
 * recolours with the brand and never falls out of step with it. It is this
 * product's own mark, deliberately not BIPKO's house logo.
 */
const STUDIO_MARK: BrandMark = {
  glyph:
    'M7.5 8.6h12.2v3.1H10.6v11.7h9.1v-3.4h3.1v6.5H7.5z ' +
    'M22.8 8.6h3.1l-3.1 3.1z ' +
    'M24.4 3.4l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z',
  tile: `linear-gradient(140deg, ${BIPKO_PINK}, #7b1d6b 62%, ${BIPKO_DEEP})`,
};

export const BRANDS: Readonly<Record<BrandId, Brand>> = {
  /**
   * Standing on its own, next to BIPKO rather than inside it. This is what
   * ships today.
   */
  studio: {
    id: 'studio',
    name: 'BIPKO Studio',
    wordmark: 'BIPKO Studio',
    house: 'BIPKO',
    houseUrl: 'https://bipko.ai/',
    tagline: ['생각한 그대로를', '바로 디자인으로'],
    description: '스토리보드 옆에서 쓰는 디자인 보드. 썸네일부터 슬라이드까지 한 자리에서 만듭니다.',
    palette: SHARED_PALETTE,
    type: SHARED_TYPE,
    mark: STUDIO_MARK,
  },

  /**
   * Absorbed: the product wears the house identity and stops naming itself
   * separately. Selected with `VITE_BRAND=bipko` on the day of the merge; the
   * wordmark and any house asset come from BIPKO's own brand kit at that
   * point, and this entry only holds what could be read from the public site.
   */
  bipko: {
    id: 'bipko',
    name: 'BIPKO',
    wordmark: 'BIPKO',
    house: null,
    houseUrl: 'https://bipko.ai/',
    tagline: ['See Your Ideas.', 'Turn Them Into Stories.'],
    description: '아이디어, 영상, 피드백을 하나의 크리에이티브 워크스페이스에서.',
    palette: SHARED_PALETTE,
    type: SHARED_TYPE,
    mark: STUDIO_MARK,
  },
};

const DEFAULT_BRAND: BrandId = 'studio';

const isBrandId = (value: string | undefined): value is BrandId =>
  value === 'studio' || value === 'bipko';

/**
 * The brand this build wears. `VITE_BRAND=bipko` is the merge switch; an
 * unset or unknown value keeps the standalone identity rather than failing a
 * build over a typo in an environment variable.
 */
export const activeBrandId = (configured: string | undefined): BrandId =>
  isBrandId(configured) ? configured : DEFAULT_BRAND;

export const brandOf = (id: BrandId): Brand => BRANDS[id];
