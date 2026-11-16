/** Ten marketing arrangements: banners, link previews and thumbnails. */

import { createShape } from '../../elements.js';
import { page } from '../../templateBuilders.js';
import type { Layout } from '../compose.js';
import { bar, blob, body, button, display, eyebrow, label, panel, rule } from '../theme.js';

const BANNER = { width: 1600, height: 500 };
const OG_CARD = { width: 1200, height: 630 };
const THUMB = { width: 1280, height: 720 };
const CARD = { width: 1050, height: 600 };
const PORTRAIT = { width: 1080, height: 1350 };

export const MARKETING_LAYOUTS: readonly Layout[] = [
  {
    id: 'mkt-banner-left',
    label: '배너 왼쪽 정렬',
    category: '마케팅',
    ...BANNER,
    build: (t) => [
      page('배너', t.palette.bg, [
        blob(t, { x: t.u(248), y: t.u(-24), width: t.u(92), height: t.u(92) }, 0.75),
        eyebrow(t, '무료 웨비나', { x: t.u(16), y: t.u(22), width: t.u(120), height: t.u(10) }, t.u(5)),
        display(t, '제목을 한 줄로 적으세요', { x: t.u(16), y: t.u(36), width: t.u(200), height: t.u(26) }, t.u(11)),
        body(t, '3월 21일 목요일 저녁 8시 · 온라인', { x: t.u(16), y: t.u(70), width: t.u(180), height: t.u(12) }, t.u(5.5)),
      ]),
    ],
  },
  {
    id: 'mkt-banner-split',
    label: '배너 분할',
    category: '마케팅',
    ...BANNER,
    build: (t) => [
      page('배너', t.palette.bg, [
        panel(t, { x: t.u(200), y: 0, width: t.u(120), height: t.u(100) }, 0, t.palette.accent),
        display(t, '한정 특가', { x: t.u(16), y: t.u(34), width: t.u(170), height: t.u(24) }, t.u(13)),
        body(t, '3월 31일까지', { x: t.u(16), y: t.u(64), width: t.u(150), height: t.u(12) }, t.u(5.2)),
        display(t, '30%', { x: t.u(210), y: t.u(30), width: t.u(100), height: t.u(30) }, t.u(18), { align: 'center', color: t.palette.onAccent }),
        body(t, 'OFF', { x: t.u(210), y: t.u(66), width: t.u(100), height: t.u(12) }, t.u(5), { align: 'center', color: t.palette.onAccent }),
      ]),
    ],
  },
  {
    id: 'mkt-og-card',
    label: '링크 미리보기',
    category: '마케팅',
    ...OG_CARD,
    build: (t) => [
      page('카드', t.palette.bg, [
        blob(t, { x: t.u(132), y: t.u(-20), width: t.u(74), height: t.u(74) }, 0.8),
        eyebrow(t, 'new', { x: t.u(12), y: t.u(16), width: t.u(60), height: t.u(9) }, t.u(4.4)),
        display(t, '이제 브라우저에서\n바로 시작하세요', { x: t.u(12), y: t.u(30), width: t.u(120), height: t.u(42) }, t.u(11)),
        body(t, 'designlab.app', { x: t.u(12), y: t.u(80), width: t.u(90), height: t.u(10) }, t.u(5)),
      ]),
    ],
  },
  {
    id: 'mkt-thumbnail',
    label: '영상 썸네일',
    category: '마케팅',
    ...THUMB,
    build: (t) => [
      page('썸네일', t.palette.bg, [
        createShape('ellipse', { x: t.u(132), y: t.u(28), width: t.u(44), height: t.u(44) }, {
          fill: { kind: 'solid', color: t.palette.accent },
          name: '재생 배경',
        }),
        createShape('triangle', { x: t.u(148), y: t.u(42), width: t.u(16), height: t.u(16) }, {
          fill: { kind: 'solid', color: t.palette.onAccent },
          rotation: 90,
          name: '재생 표시',
        }),
        ...button(t, '무료 공개', { x: t.u(8), y: t.u(12), width: t.u(38), height: t.u(11) }, t.u(4.2)),
        display(t, '이 기능 하나로\n작업 시간 절반', { x: t.u(8), y: t.u(30), width: t.u(120), height: t.u(40) }, t.u(12)),
        body(t, '3분 요약 영상', { x: t.u(8), y: t.u(76), width: t.u(100), height: t.u(10) }, t.u(5)),
      ]),
    ],
  },
  {
    id: 'mkt-coupon',
    label: '쿠폰',
    category: '마케팅',
    ...CARD,
    build: (t) => [
      page('쿠폰', t.palette.bg, [
        panel(t, { x: t.u(6), y: t.u(10), width: t.u(163), height: t.u(80) }, t.u(4)),
        createShape('line', { x: t.u(120), y: t.u(14), width: t.u(1), height: t.u(72) }, {
          stroke: { color: t.palette.accentSoft, width: Math.max(2, t.u(0.6)), dash: t.u(2) },
          rotation: 90,
          name: '절취선',
        }),
        display(t, '첫 주문 20%', { x: t.u(14), y: t.u(26), width: t.u(100), height: t.u(20) }, t.u(10)),
        body(t, '3월 31일까지 · 1인 1회', { x: t.u(14), y: t.u(52), width: t.u(100), height: t.u(12) }, t.u(4.6)),
        eyebrow(t, 'code', { x: t.u(124), y: t.u(32), width: t.u(42), height: t.u(8) }, t.u(3.6), { align: 'center' }),
        label(t, 'SPRING20', { x: t.u(124), y: t.u(42), width: t.u(42), height: t.u(14) }, t.u(6.4), { align: 'center', color: t.palette.accent }),
      ]),
    ],
  },
  {
    id: 'mkt-feature-list',
    label: '기능 세 가지',
    category: '마케팅',
    ...OG_CARD,
    build: (t) => [
      page('카드', t.palette.bg, [
        display(t, '세 가지만 기억하세요', { x: t.u(10), y: t.u(14), width: t.u(150), height: t.u(18) }, t.u(9)),
        bar(t, { x: t.u(10), y: t.u(38), width: t.u(16), height: t.u(1.4) }),
        panel(t, { x: t.u(10), y: t.u(48), width: t.u(55), height: t.u(42) }, t.u(3)),
        label(t, '빠르게', { x: t.u(16), y: t.u(55), width: t.u(44), height: t.u(10) }, t.u(5.4)),
        body(t, '30분이면 한 장', { x: t.u(16), y: t.u(68), width: t.u(44), height: t.u(14) }, t.u(3.8)),
        panel(t, { x: t.u(72), y: t.u(48), width: t.u(55), height: t.u(42) }, t.u(3)),
        label(t, '정확하게', { x: t.u(78), y: t.u(55), width: t.u(44), height: t.u(10) }, t.u(5.4)),
        body(t, '화면 그대로 인쇄', { x: t.u(78), y: t.u(68), width: t.u(44), height: t.u(14) }, t.u(3.8)),
        panel(t, { x: t.u(134), y: t.u(48), width: t.u(55), height: t.u(42) }, t.u(3), t.palette.accent),
        label(t, '어디서나', { x: t.u(140), y: t.u(55), width: t.u(44), height: t.u(10) }, t.u(5.4), { color: t.palette.onAccent }),
        body(t, '설치 없이 브라우저', { x: t.u(140), y: t.u(68), width: t.u(44), height: t.u(14) }, t.u(3.8), { color: t.palette.onAccent }),
      ]),
    ],
  },
  {
    id: 'mkt-testimonial',
    label: '고객 후기',
    category: '마케팅',
    ...OG_CARD,
    build: (t) => [
      page('카드', t.palette.bg, [
        display(t, '“', { x: t.u(10), y: t.u(8), width: t.u(30), height: t.u(28) }, t.u(24), { color: t.palette.accentSoft }),
        display(t, '처음 써보는데도\n30분 만에 끝났어요', { x: t.u(10), y: t.u(32), width: t.u(150), height: t.u(34) }, t.u(8.5)),
        rule(t, { x: t.u(10), y: t.u(74), width: t.u(24), height: t.u(0.5) }),
        body(t, '박서진 · 카페 운영', { x: t.u(10), y: t.u(80), width: t.u(100), height: t.u(10) }, t.u(4.2)),
      ]),
    ],
  },
  {
    id: 'mkt-newsletter',
    label: '뉴스레터 머리글',
    category: '마케팅',
    ...BANNER,
    build: (t) => [
      page('헤더', t.palette.bg, [
        eyebrow(t, 'the weekly', { x: t.u(16), y: t.u(24), width: t.u(140), height: t.u(10) }, t.u(5)),
        display(t, '이번 주의 디자인', { x: t.u(16), y: t.u(38), width: t.u(220), height: t.u(26) }, t.u(13)),
        rule(t, { x: t.u(16), y: t.u(74), width: t.u(288), height: t.u(0.6) }),
        body(t, '3월 둘째 주 · 12호', { x: t.u(16), y: t.u(80), width: t.u(288), height: t.u(10) }, t.u(4.6), { align: 'right' }),
      ]),
    ],
  },
  {
    id: 'mkt-hiring',
    label: '채용 공고',
    category: '마케팅',
    ...PORTRAIT,
    build: (t) => [
      page('공고', t.palette.bg, [
        panel(t, { x: 0, y: 0, width: t.u(100), height: t.u(40) }, 0, t.palette.accent),
        eyebrow(t, "we're hiring", { x: t.u(8), y: t.u(12), width: t.u(70), height: t.u(6) }, t.u(2.8), { color: t.palette.onAccent }),
        display(t, '프로덕트 디자이너', { x: t.u(8), y: t.u(20), width: t.u(84), height: t.u(14) }, t.u(7.4), { color: t.palette.onAccent }),
        label(t, '하는 일', { x: t.u(8), y: t.u(48), width: t.u(84), height: t.u(7) }, t.u(3.8)),
        body(t, '제품의 화면과 흐름을 설계하고, 만들어진 결과를 직접 확인합니다.', { x: t.u(8), y: t.u(56), width: t.u(84), height: t.u(16) }, t.u(3.4)),
        label(t, '찾는 분', { x: t.u(8), y: t.u(76), width: t.u(84), height: t.u(7) }, t.u(3.8)),
        body(t, '· 완성까지 책임지는 분\n· 근거로 설명할 수 있는 분\n· 작은 디테일을 끝까지 보는 분', { x: t.u(8), y: t.u(84), width: t.u(84), height: t.u(24) }, t.u(3.4)),
        ...button(t, '지원하기', { x: t.u(8), y: t.u(114), width: t.u(44), height: t.u(10) }, t.u(3.6)),
      ]),
    ],
  },
  {
    id: 'mkt-countdown',
    label: '날짜 강조',
    category: '마케팅',
    ...CARD,
    build: (t) => [
      page('카드', t.palette.bg, [
        panel(t, { x: t.u(10), y: t.u(18), width: t.u(46), height: t.u(64) }, t.u(4), t.palette.accent),
        display(t, '03', { x: t.u(10), y: t.u(28), width: t.u(46), height: t.u(22) }, t.u(16), { align: 'center', color: t.palette.onAccent }),
        body(t, 'MARCH', { x: t.u(10), y: t.u(56), width: t.u(46), height: t.u(10) }, t.u(4.4), { align: 'center', color: t.palette.onAccent }),
        display(t, '봄맞이\n워크숍', { x: t.u(64), y: t.u(22), width: t.u(100), height: t.u(30) }, t.u(11)),
        body(t, '오후 2시 — 5시 · 성수', { x: t.u(64), y: t.u(60), width: t.u(100), height: t.u(12) }, t.u(4.4)),
      ]),
    ],
  },
];
