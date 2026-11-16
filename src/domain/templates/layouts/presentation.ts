/** Ten slide arrangements, all 1920 × 1080. */

import { createShape } from '../../elements.js';
import { page } from '../../templateBuilders.js';
import type { DesignElement } from '../../document.js';
import type { Layout } from '../compose.js';
import { bar, blob, body, display, eyebrow, label, panel, rule, type Theme } from '../theme.js';

const SLIDE = { width: 1920, height: 1080 };

/** A figure and its caption, the unit a metrics slide repeats. */
const stat = (t: Theme, x: number, value: string, caption: string, color?: string): readonly DesignElement[] => [
  display(t, value, { x, y: t.u(42), width: t.u(42), height: t.u(18) }, t.u(14), { ...(color === undefined ? {} : { color }) }),
  body(t, caption, { x, y: t.u(62), width: t.u(42), height: t.u(8) }, t.u(3.2)),
];

export const PRESENTATION_LAYOUTS: readonly Layout[] = [
  {
    id: 'deck-title',
    label: '표지',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('표지', t.palette.bg, [
        bar(t, { x: 0, y: 0, width: t.u(1.6), height: t.u(100) }),
        blob(t, { x: t.u(148), y: t.u(16), width: t.u(38), height: t.u(38) }, 0.7),
        display(t, '발표 제목을 적으세요', { x: t.u(16), y: t.u(36), width: t.u(120), height: t.u(18) }, t.u(11)),
        body(t, '부제목 한 줄', { x: t.u(16), y: t.u(56), width: t.u(110), height: t.u(10) }, t.u(4.4)),
        eyebrow(t, '2026년 3월 · 팀 이름', { x: t.u(16), y: t.u(82), width: t.u(90), height: t.u(7) }, t.u(2.6)),
      ]),
    ],
  },
  {
    id: 'deck-agenda',
    label: '목차',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('목차', t.palette.bg, [
        display(t, '오늘 다룰 내용', { x: t.u(16), y: t.u(14), width: t.u(100), height: t.u(12) }, t.u(7.6)),
        rule(t, { x: t.u(16), y: t.u(30), width: t.u(156), height: t.u(0.3) }),
        body(t, '01   배경과 문제\n02   지금까지의 결과\n03   올해의 선택\n04   실행 계획', { x: t.u(16), y: t.u(38), width: t.u(130), height: t.u(46) }, t.u(5)),
      ]),
    ],
  },
  {
    id: 'deck-section',
    label: '섹션 구분',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('섹션', t.palette.bg, [
        display(t, '01', { x: t.u(16), y: t.u(28), width: t.u(40), height: t.u(28) }, t.u(24), { color: t.palette.accentSoft }),
        display(t, '배경과 문제', { x: t.u(16), y: t.u(58), width: t.u(120), height: t.u(14) }, t.u(9)),
        bar(t, { x: t.u(16), y: t.u(76), width: t.u(20), height: t.u(1) }),
      ]),
    ],
  },
  {
    id: 'deck-two-column',
    label: '두 단 본문',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('본문', t.palette.bg, [
        display(t, '무엇이 달라졌나', { x: t.u(16), y: t.u(13), width: t.u(120), height: t.u(12) }, t.u(7.2)),
        bar(t, { x: t.u(16), y: t.u(30), width: t.u(6), height: t.u(0.8) }),
        label(t, '사용자', { x: t.u(16), y: t.u(36), width: t.u(70), height: t.u(8) }, t.u(4.4)),
        body(t, '모바일에서 먼저 열어보고, 결정은 데스크톱에서 합니다. 첫 화면에서 결과를 보여주지 못하면 다음 단계로 가지 않습니다.', { x: t.u(16), y: t.u(46), width: t.u(70), height: t.u(30) }, t.u(3.4)),
        bar(t, { x: t.u(100), y: t.u(30), width: t.u(6), height: t.u(0.8) }, t.palette.inkSoft),
        label(t, '시장', { x: t.u(100), y: t.u(36), width: t.u(70), height: t.u(8) }, t.u(4.4)),
        body(t, '경쟁 제품이 무료 구간을 넓히면서, 가격이 아니라 완성까지 걸리는 시간이 선택 기준이 되었습니다.', { x: t.u(100), y: t.u(46), width: t.u(70), height: t.u(30) }, t.u(3.4)),
      ]),
    ],
  },
  {
    id: 'deck-stats',
    label: '지표 세 개',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('지표', t.palette.bg, [
        display(t, '핵심 지표', { x: t.u(16), y: t.u(13), width: t.u(100), height: t.u(12) }, t.u(7.2)),
        rule(t, { x: t.u(16), y: t.u(34), width: t.u(156), height: t.u(0.3) }),
        ...stat(t, t.u(16), '+42%', '주간 활성 사용자', t.palette.accent),
        ...stat(t, t.u(72), '2.4배', '첫 완성률'),
        ...stat(t, t.u(128), '18일', '평균 재방문 주기', t.palette.inkSoft),
      ]),
    ],
  },
  {
    id: 'deck-quote',
    label: '인용 슬라이드',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('인용', t.palette.bg, [
        display(t, '“', { x: t.u(14), y: t.u(10), width: t.u(24), height: t.u(26) }, t.u(26), { color: t.palette.accentSoft }),
        display(t, '덜어낼 것이 없을 때\n비로소 완성된다', { x: t.u(16), y: t.u(34), width: t.u(150), height: t.u(30) }, t.u(9)),
        body(t, '생텍쥐페리', { x: t.u(16), y: t.u(72), width: t.u(80), height: t.u(8) }, t.u(3.4)),
      ]),
    ],
  },
  {
    id: 'deck-compare',
    label: '비교 표',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('비교', t.palette.bg, [
        display(t, '두 가지 선택', { x: t.u(16), y: t.u(12), width: t.u(100), height: t.u(12) }, t.u(7.2)),
        panel(t, { x: t.u(16), y: t.u(32), width: t.u(74), height: t.u(54) }, t.u(2)),
        label(t, '지금 방식', { x: t.u(23), y: t.u(39), width: t.u(60), height: t.u(8) }, t.u(4.4)),
        body(t, '· 매번 새로 만든다\n· 결과가 사람마다 다르다\n· 수정에 시간이 걸린다', { x: t.u(23), y: t.u(50), width: t.u(60), height: t.u(28) }, t.u(3.2)),
        panel(t, { x: t.u(98), y: t.u(32), width: t.u(74), height: t.u(54) }, t.u(2), t.palette.accent),
        label(t, '바꾼 뒤', { x: t.u(105), y: t.u(39), width: t.u(60), height: t.u(8) }, t.u(4.4), { color: t.palette.onAccent }),
        body(t, '· 템플릿에서 시작한다\n· 결과가 일정하다\n· 고치기만 하면 된다', { x: t.u(105), y: t.u(50), width: t.u(60), height: t.u(28) }, t.u(3.2), { color: t.palette.onAccent }),
      ]),
    ],
  },
  {
    id: 'deck-timeline',
    label: '일정',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('일정', t.palette.bg, [
        display(t, '진행 계획', { x: t.u(16), y: t.u(13), width: t.u(100), height: t.u(12) }, t.u(7.2)),
        createShape('line', { x: t.u(16), y: t.u(56), width: t.u(156), height: t.u(0.6) }, {
          stroke: { color: t.palette.accentSoft, width: Math.max(2, t.u(0.6)), dash: 0 },
          name: '일정선',
        }),
        ...[0, 1, 2, 3].flatMap((index) => {
          const x = t.u(16 + index * 40);
          return [
            createShape('ellipse', { x, y: t.u(52), width: t.u(5), height: t.u(5) }, {
              fill: { kind: 'solid', color: t.palette.accent },
              name: '시점',
            }),
            label(t, `${index + 1}분기`, { x, y: t.u(38), width: t.u(34), height: t.u(8) }, t.u(3.8)),
            body(t, ['준비', '시범 운영', '정식 공개', '확장'][index] ?? '', { x, y: t.u(62), width: t.u(34), height: t.u(10) }, t.u(3.2)),
          ];
        }),
      ]),
    ],
  },
  {
    id: 'deck-image-text',
    label: '그림과 글',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('본문', t.palette.bg, [
        panel(t, { x: t.u(96), y: t.u(12), width: t.u(76), height: t.u(76) }, t.u(2), t.palette.accentSoft),
        body(t, '이미지 자리', { x: t.u(96), y: t.u(48), width: t.u(76), height: t.u(8) }, t.u(3.4), { align: 'center' }),
        display(t, '보여주고\n설명한다', { x: t.u(16), y: t.u(24), width: t.u(70), height: t.u(28) }, t.u(8.4)),
        body(t, '왼쪽에서 설명하고 오른쪽에서 보여주면, 듣는 사람이 눈을 옮기지 않고 따라올 수 있습니다.', { x: t.u(16), y: t.u(58), width: t.u(68), height: t.u(26) }, t.u(3.4)),
      ]),
    ],
  },
  {
    id: 'deck-closing',
    label: '마무리',
    category: '프레젠테이션',
    ...SLIDE,
    build: (t) => [
      page('마무리', t.palette.bg, [
        display(t, '감사합니다', { x: t.u(16), y: t.u(38), width: t.u(120), height: t.u(18) }, t.u(12)),
        body(t, '질문은 언제든 — team@example.com', { x: t.u(16), y: t.u(60), width: t.u(120), height: t.u(10) }, t.u(4)),
        bar(t, { x: t.u(16), y: t.u(78), width: t.u(18), height: t.u(1) }),
      ]),
    ],
  },
];
