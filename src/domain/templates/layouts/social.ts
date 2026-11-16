/** Ten social arrangements: square posts, stories and portrait feeds. */

import { createShape } from '../../elements.js';
import { page } from '../../templateBuilders.js';
import type { Layout } from '../compose.js';
import { bar, blob, body, button, display, eyebrow, label, panel, rule } from '../theme.js';

const SQUARE = { width: 1080, height: 1080 };
const STORY = { width: 1080, height: 1920 };
const PORTRAIT = { width: 1080, height: 1350 };

export const SOCIAL_LAYOUTS: readonly Layout[] = [
  {
    id: 'social-hero-left',
    label: '왼쪽 히어로',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        blob(t, { x: t.u(58), y: t.u(-14), width: t.u(62), height: t.u(62) }, 0.7),
        eyebrow(t, '새로운 소식', { x: t.u(9), y: t.u(14), width: t.u(60), height: t.u(5) }, t.u(2.4)),
        display(t, '지금\n시작하세요', { x: t.u(9), y: t.u(22), width: t.u(70), height: t.u(34) }, t.u(13)),
        body(t, '설명을 한두 문장으로 적으면 충분합니다. 짧을수록 끝까지 읽힙니다.', { x: t.u(9), y: t.u(60), width: t.u(62), height: t.u(16) }, t.u(3.2)),
        ...button(t, '자세히 보기', { x: t.u(9), y: t.u(80), width: t.u(34), height: t.u(9) }, t.u(3)),
      ]),
    ],
  },
  {
    id: 'social-centred',
    label: '가운데 정렬',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        eyebrow(t, 'announcement', { x: t.u(10), y: t.u(22), width: t.u(80), height: t.u(5) }, t.u(2.4), { align: 'center' }),
        display(t, '한 줄로\n전하는 말', { x: t.u(8), y: t.u(32), width: t.u(84), height: t.u(30) }, t.u(12), { align: 'center' }),
        bar(t, { x: t.u(44), y: t.u(66), width: t.u(12), height: t.u(1.2) }),
        body(t, '가운데 정렬은 짧은 문장일 때만 읽기 편합니다.', { x: t.u(14), y: t.u(72), width: t.u(72), height: t.u(12) }, t.u(3), { align: 'center' }),
      ]),
    ],
  },
  {
    id: 'social-number',
    label: '큰 숫자',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        display(t, '05', { x: t.u(9), y: t.u(10), width: t.u(30), height: t.u(22) }, t.u(19), { color: t.palette.accentSoft }),
        display(t, '알아두면\n좋은 다섯 가지', { x: t.u(9), y: t.u(32), width: t.u(78), height: t.u(38) }, t.u(9.5)),
        bar(t, { x: t.u(9), y: t.u(76), width: t.u(17), height: t.u(0.9) }),
        body(t, '넘겨서 보기 →', { x: t.u(9), y: t.u(82), width: t.u(50), height: t.u(6) }, t.u(2.8)),
      ]),
    ],
  },
  {
    id: 'social-step-card',
    label: '단계 카드',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        createShape('ellipse', { x: t.u(9), y: t.u(10), width: t.u(9), height: t.u(9) }, {
          fill: { kind: 'solid', color: t.palette.accent },
          name: '단계 번호판',
        }),
        label(t, '1', { x: t.u(9), y: t.u(12.2), width: t.u(9), height: t.u(5) }, t.u(4.4), { align: 'center', color: t.palette.onAccent }),
        display(t, '여백을 먼저 정한다', { x: t.u(9), y: t.u(25), width: t.u(80), height: t.u(16) }, t.u(7)),
        body(t, '요소를 채우기 전에 가장자리와 요소 사이의 간격을 먼저 정하세요. 간격이 일정하면 그 안에서 무엇을 넣어도 정돈돼 보입니다.', { x: t.u(9), y: t.u(44), width: t.u(80), height: t.u(28) }, t.u(3.4)),
        rule(t, { x: t.u(9), y: t.u(86), width: t.u(80), height: t.u(0.3) }),
        body(t, '1 / 5', { x: t.u(9), y: t.u(89), width: t.u(80), height: t.u(5) }, t.u(2.4), { align: 'right' }),
      ]),
    ],
  },
  {
    id: 'social-quote',
    label: '인용',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        display(t, '“', { x: t.u(9), y: t.u(8), width: t.u(20), height: t.u(22) }, t.u(22), { color: t.palette.accentSoft }),
        display(t, '좋은 디자인은\n설명이 필요 없다', { x: t.u(9), y: t.u(30), width: t.u(80), height: t.u(34) }, t.u(8.5)),
        bar(t, { x: t.u(9), y: t.u(70), width: t.u(14), height: t.u(0.8) }),
        body(t, '디터 람스', { x: t.u(9), y: t.u(75), width: t.u(60), height: t.u(6) }, t.u(2.8)),
      ]),
    ],
  },
  {
    id: 'social-split',
    label: '좌우 분할',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        panel(t, { x: 0, y: 0, width: t.u(50), height: t.u(100) }, 0, t.palette.accent),
        display(t, 'BEFORE', { x: t.u(6), y: t.u(44), width: t.u(38), height: t.u(12) }, t.u(6), { align: 'center', color: t.palette.onAccent }),
        display(t, 'AFTER', { x: t.u(56), y: t.u(44), width: t.u(38), height: t.u(12) }, t.u(6), { align: 'center' }),
        body(t, '같은 재료, 다른 정리', { x: t.u(10), y: t.u(86), width: t.u(80), height: t.u(8) }, t.u(3.2), { align: 'center' }),
      ]),
    ],
  },
  {
    id: 'social-profile',
    label: '프로필',
    category: '소셜',
    ...SQUARE,
    build: (t) => [
      page('포스트', t.palette.bg, [
        createShape('ellipse', { x: t.u(36), y: t.u(11), width: t.u(28), height: t.u(28) }, {
          fill: { kind: 'gradient', from: t.palette.accent, to: t.palette.accentSoft, angle: 140 },
          name: '사진 자리',
        }),
        display(t, '이름을 적으세요', { x: t.u(8), y: t.u(45), width: t.u(84), height: t.u(12) }, t.u(7.5), { align: 'center' }),
        body(t, '직함 · 소속', { x: t.u(8), y: t.u(59), width: t.u(84), height: t.u(6) }, t.u(3.1), { align: 'center' }),
        rule(t, { x: t.u(36), y: t.u(70), width: t.u(28), height: t.u(0.3) }),
        body(t, '“한 문장으로 자신을 소개하면 기억에 남습니다.”', { x: t.u(13), y: t.u(75), width: t.u(74), height: t.u(14) }, t.u(3.3), { align: 'center' }),
      ]),
    ],
  },
  {
    id: 'social-story-bold',
    label: '스토리 대형 문구',
    category: '소셜',
    ...STORY,
    build: (t) => [
      page('스토리', t.palette.bg, [
        blob(t, { x: t.u(55), y: t.u(128), width: t.u(60), height: t.u(60) }, 0.65),
        eyebrow(t, 'new drop', { x: t.u(10), y: t.u(32), width: t.u(70), height: t.u(5) }, t.u(2.6)),
        display(t, '가을\n신상', { x: t.u(10), y: t.u(42), width: t.u(80), height: t.u(50) }, t.u(18)),
        body(t, '오늘 오후 8시 공개', { x: t.u(10), y: t.u(96), width: t.u(70), height: t.u(8) }, t.u(3.4)),
        ...button(t, '둘러보기', { x: t.u(10), y: t.u(112), width: t.u(38), height: t.u(9) }, t.u(3.2)),
      ]),
    ],
  },
  {
    id: 'social-story-card',
    label: '스토리 카드',
    category: '소셜',
    ...STORY,
    build: (t) => [
      page('스토리', t.palette.bg, [
        panel(t, { x: t.u(8), y: t.u(38), width: t.u(84), height: t.u(100) }, t.u(5)),
        eyebrow(t, '공지', { x: t.u(14), y: t.u(48), width: t.u(60), height: t.u(5) }, t.u(2.6)),
        display(t, '알려드립니다', { x: t.u(14), y: t.u(57), width: t.u(72), height: t.u(16) }, t.u(8), { color: t.palette.dark ? t.palette.ink : t.palette.ink }),
        body(t, '내용을 적으세요. 카드 안에 넣으면 배경이 복잡해도 글이 읽힙니다.', { x: t.u(14), y: t.u(78), width: t.u(72), height: t.u(24) }, t.u(3.3)),
        rule(t, { x: t.u(14), y: t.u(112), width: t.u(72), height: t.u(0.3) }),
        body(t, '@계정이름', { x: t.u(14), y: t.u(118), width: t.u(72), height: t.u(6) }, t.u(2.8)),
      ]),
    ],
  },
  {
    id: 'social-portrait-list',
    label: '세로 목록',
    category: '소셜',
    ...PORTRAIT,
    build: (t) => [
      page('포스트', t.palette.bg, [
        eyebrow(t, 'checklist', { x: t.u(9), y: t.u(12), width: t.u(70), height: t.u(5) }, t.u(2.5)),
        display(t, '시작 전에\n확인할 것', { x: t.u(9), y: t.u(20), width: t.u(80), height: t.u(28) }, t.u(9)),
        bar(t, { x: t.u(9), y: t.u(52), width: t.u(14), height: t.u(0.9) }),
        body(t, '01   목적을 한 문장으로 적는다\n02   보는 사람을 정한다\n03   가장 중요한 것 하나만 남긴다\n04   나머지를 덜어낸다', { x: t.u(9), y: t.u(60), width: t.u(80), height: t.u(50) }, t.u(3.6)),
        body(t, '자세한 내용은 프로필 링크에서', { x: t.u(9), y: t.u(116), width: t.u(80), height: t.u(6) }, t.u(2.7)),
      ]),
    ],
  },
];
