/** Ten print arrangements: A4 sheets, posters, cards and tickets. */

import { createShape } from '../../elements.js';
import { page } from '../../templateBuilders.js';
import type { DesignElement } from '../../document.js';
import type { Layout } from '../compose.js';
import { bar, body, button, display, eyebrow, label, panel, rule, type Theme } from '../theme.js';

const A4 = { width: 2480, height: 3508 };
const POSTER = { width: 1587, height: 2245 };
const CARD = { width: 1050, height: 600 };

/** A named item with its price, the unit a tariff sheet repeats. */
const priced = (t: Theme, y: number, name: string, note: string, price: string): readonly DesignElement[] => [
  label(t, name, { x: t.u(12), y, width: t.u(55), height: t.u(5) }, t.u(3.6)),
  body(t, note, { x: t.u(12), y: y + t.u(5), width: t.u(55), height: t.u(4) }, t.u(2.2)),
  label(t, price, { x: t.u(70), y, width: t.u(18), height: t.u(5) }, t.u(3.4), { align: 'right' }),
];

export const PRINT_LAYOUTS: readonly Layout[] = [
  {
    id: 'print-flyer',
    label: 'A4 전단지',
    category: '인쇄',
    ...A4,
    build: (t) => [
      page('전단지', t.palette.bg, [
        panel(t, { x: 0, y: 0, width: t.u(100), height: t.u(48) }, 0, t.palette.accent),
        eyebrow(t, '안내', { x: t.u(8), y: t.u(12), width: t.u(70), height: t.u(4) }, t.u(2.4), { color: t.palette.onAccent }),
        display(t, '제목을\n두 줄로', { x: t.u(8), y: t.u(18), width: t.u(84), height: t.u(22) }, t.u(9), { color: t.palette.onAccent }),
        body(t, '설명을 적으세요. 전단지는 멀리서 제목만 읽히면 성공입니다.', { x: t.u(8), y: t.u(56), width: t.u(80), height: t.u(12) }, t.u(3),),
        rule(t, { x: t.u(8), y: t.u(72), width: t.u(84), height: t.u(0.2) }),
        body(t, '일시   3월 23일 토요일 오후 2시\n장소   성수 디자인 스테이션\n정원   16명 (선착순)', { x: t.u(8), y: t.u(76), width: t.u(84), height: t.u(22) }, t.u(3)),
        ...button(t, '신청하기', { x: t.u(8), y: t.u(106), width: t.u(34), height: t.u(8) }, t.u(3)),
        body(t, 'example.kr   ·   02-1234-5678', { x: t.u(8), y: t.u(126), width: t.u(84), height: t.u(6) }, t.u(2.4)),
      ]),
    ],
  },
  {
    id: 'print-poster-type',
    label: '타이포 포스터',
    category: '인쇄',
    ...POSTER,
    build: (t) => [
      page('포스터', t.palette.bg, [
        eyebrow(t, '2026 . 03 . 14', { x: t.u(9), y: t.u(12), width: t.u(70), height: t.u(5) }, t.u(3)),
        display(t, '디자인\n컨퍼런스', { x: t.u(9), y: t.u(22), width: t.u(84), height: t.u(50) }, t.u(18)),
        body(t, '성수 디자인 스테이션 · 오후 1시 — 7시', { x: t.u(9), y: t.u(78), width: t.u(80), height: t.u(8) }, t.u(3.2)),
        rule(t, { x: t.u(9), y: t.u(90), width: t.u(82), height: t.u(0.3) }),
        body(t, '초청 연사\n김하늘 — 브랜드 디렉터\n이도윤 — 프로덕트 디자이너\n박서진 — 모션 디자이너', { x: t.u(9), y: t.u(96), width: t.u(80), height: t.u(26) }, t.u(3)),
        ...button(t, '참가 신청', { x: t.u(9), y: t.u(128), width: t.u(34), height: t.u(8) }, t.u(3)),
      ]),
    ],
  },
  {
    id: 'print-poster-centred',
    label: '가운데 포스터',
    category: '인쇄',
    ...POSTER,
    build: (t) => [
      page('포스터', t.palette.bg, [
        rule(t, { x: t.u(9), y: t.u(16), width: t.u(82), height: t.u(0.3) }),
        eyebrow(t, 'presents', { x: t.u(9), y: t.u(22), width: t.u(82), height: t.u(5) }, t.u(2.6), { align: 'center' }),
        display(t, '봄밤\n음악회', { x: t.u(9), y: t.u(38), width: t.u(82), height: t.u(44) }, t.u(16), { align: 'center' }),
        body(t, '3월 29일 금요일 오후 7시 30분\n성수 아트홀', { x: t.u(9), y: t.u(92), width: t.u(82), height: t.u(16) }, t.u(3.2), { align: 'center' }),
        rule(t, { x: t.u(9), y: t.u(126), width: t.u(82), height: t.u(0.3) }),
      ]),
    ],
  },
  {
    id: 'print-price-list',
    label: '가격표',
    category: '인쇄',
    ...A4,
    build: (t) => [
      page('가격표', t.palette.bg, [
        eyebrow(t, 'price', { x: t.u(12), y: t.u(12), width: t.u(60), height: t.u(5) }, t.u(2.8)),
        display(t, '서비스 안내', { x: t.u(12), y: t.u(19), width: t.u(80), height: t.u(14) }, t.u(9)),
        rule(t, { x: t.u(12), y: t.u(38), width: t.u(76), height: t.u(0.25) }),
        ...priced(t, t.u(46), '로고 디자인', '시안 3안 · 수정 2회', '800,000'),
        ...priced(t, t.u(60), '명함 디자인', '앞뒤 양면 · 인쇄 파일 포함', '250,000'),
        ...priced(t, t.u(74), '포스터 한 장', 'A4 또는 A3 · 인쇄 파일 포함', '320,000'),
        ...priced(t, t.u(88), '브랜드 가이드', '색상 · 서체 · 사용 규칙', '1,400,000'),
        ...priced(t, t.u(102), 'SNS 템플릿', '5종 세트 · 편집 가능', '480,000'),
        rule(t, { x: t.u(12), y: t.u(118), width: t.u(76), height: t.u(0.25) }),
        body(t, '· 표시 가격은 부가세 별도입니다.\n· 문의  hello@example.kr', { x: t.u(12), y: t.u(124), width: t.u(76), height: t.u(12) }, t.u(2.2)),
      ]),
    ],
  },
  {
    id: 'print-menu',
    label: '메뉴판',
    category: '인쇄',
    ...A4,
    build: (t) => [
      page('메뉴', t.palette.bg, [
        display(t, 'MORNING\nCAFE', { x: t.u(12), y: t.u(10), width: t.u(76), height: t.u(22) }, t.u(11)),
        rule(t, { x: t.u(12), y: t.u(36), width: t.u(76), height: t.u(0.3) }),
        eyebrow(t, 'coffee', { x: t.u(12), y: t.u(42), width: t.u(60), height: t.u(5) }, t.u(2.8)),
        body(t, '에스프레소\n아메리카노\n플랫 화이트\n카페 라떼\n콜드브루', { x: t.u(12), y: t.u(50), width: t.u(55), height: t.u(28) }, t.u(3.2)),
        body(t, '4,000\n4,500\n5,200\n5,000\n5,800', { x: t.u(70), y: t.u(50), width: t.u(18), height: t.u(28) }, t.u(3.2), { align: 'right' }),
        eyebrow(t, 'dessert', { x: t.u(12), y: t.u(86), width: t.u(60), height: t.u(5) }, t.u(2.8)),
        body(t, '버터 크루아상\n바스크 치즈케이크\n레몬 파운드', { x: t.u(12), y: t.u(94), width: t.u(55), height: t.u(18) }, t.u(3.2)),
        body(t, '4,800\n6,500\n5,200', { x: t.u(70), y: t.u(94), width: t.u(18), height: t.u(18) }, t.u(3.2), { align: 'right' }),
      ]),
    ],
  },
  {
    id: 'print-invitation',
    label: '초대장',
    category: '인쇄',
    ...POSTER,
    build: (t) => [
      page('초대장', t.palette.bg, [
        createShape('rectangle', { x: t.u(6), y: t.u(6), width: t.u(88), height: t.u(129) }, {
          fill: { kind: 'none' },
          stroke: { color: t.palette.accent, width: Math.max(2, t.u(0.3)), dash: 0 },
          name: '테두리',
        }),
        eyebrow(t, '초대합니다', { x: t.u(14), y: t.u(24), width: t.u(72), height: t.u(6) }, t.u(2.8), { align: 'center' }),
        display(t, '오픈\n하우스', { x: t.u(12), y: t.u(38), width: t.u(76), height: t.u(34) }, t.u(14), { align: 'center' }),
        rule(t, { x: t.u(40), y: t.u(78), width: t.u(20), height: t.u(0.3) }),
        body(t, '4월 12일 토요일 오후 5시\n서울 성동구 연무장길 45', { x: t.u(14), y: t.u(86), width: t.u(72), height: t.u(16) }, t.u(3.2), { align: 'center' }),
        body(t, '참석 여부를 4월 5일까지 알려주세요', { x: t.u(14), y: t.u(118), width: t.u(72), height: t.u(6) }, t.u(2.4), { align: 'center' }),
      ]),
    ],
  },
  {
    id: 'print-business-card',
    label: '명함',
    category: '인쇄',
    ...CARD,
    build: (t) => [
      page('앞면', t.palette.bg, [
        bar(t, { x: 0, y: 0, width: t.u(3), height: t.u(100) }),
        display(t, '이름', { x: t.u(14), y: t.u(30), width: t.u(80), height: t.u(14) }, t.u(9)),
        body(t, '직함 · 회사', { x: t.u(14), y: t.u(48), width: t.u(80), height: t.u(8) }, t.u(3.6)),
        body(t, 'name@example.kr   ·   010-1234-5678', { x: t.u(14), y: t.u(70), width: t.u(120), height: t.u(8) }, t.u(3.2)),
      ]),
      page('뒷면', { kind: 'solid', color: t.palette.accent }, [
        display(t, 'STUDIO', { x: t.u(14), y: t.u(40), width: t.u(100), height: t.u(14) }, t.u(9), { color: t.palette.onAccent }),
      ]),
    ],
  },
  {
    id: 'print-ticket',
    label: '티켓',
    category: '인쇄',
    ...CARD,
    build: (t) => [
      page('앞면', t.palette.bg, [
        eyebrow(t, 'admit one', { x: t.u(8), y: t.u(14), width: t.u(80), height: t.u(6) }, t.u(2.8)),
        display(t, '봄밤 음악회', { x: t.u(8), y: t.u(26), width: t.u(110), height: t.u(16) }, t.u(9)),
        body(t, '3월 29일 금요일 오후 7시 30분', { x: t.u(8), y: t.u(50), width: t.u(110), height: t.u(8) }, t.u(3.2)),
        createShape('line', { x: t.u(8), y: t.u(72), width: t.u(90), height: t.u(0.4) }, {
          stroke: { color: t.palette.accentSoft, width: Math.max(2, t.u(0.4)), dash: t.u(2) },
          name: '절취선',
        }),
        label(t, 'NO. 0142', { x: t.u(8), y: t.u(78), width: t.u(70), height: t.u(8) }, t.u(3.4), { color: t.palette.accent }),
      ]),
    ],
  },
  {
    id: 'print-certificate',
    label: '상장',
    category: '인쇄',
    ...A4,
    build: (t) => [
      page('상장', t.palette.bg, [
        createShape('rectangle', { x: t.u(8), y: t.u(8), width: t.u(84), height: t.u(125) }, {
          fill: { kind: 'none' },
          stroke: { color: t.palette.accent, width: Math.max(2, t.u(0.4)), dash: 0 },
          name: '테두리',
        }),
        eyebrow(t, 'certificate', { x: t.u(14), y: t.u(26), width: t.u(72), height: t.u(6) }, t.u(2.8), { align: 'center' }),
        display(t, '수료증', { x: t.u(14), y: t.u(36), width: t.u(72), height: t.u(16) }, t.u(12), { align: 'center' }),
        rule(t, { x: t.u(40), y: t.u(58), width: t.u(20), height: t.u(0.3) }),
        body(t, '위 사람은 2026년 봄 디자인 과정을\n성실히 이수하였기에 이 증서를 드립니다.', { x: t.u(16), y: t.u(70), width: t.u(68), height: t.u(16) }, t.u(3), { align: 'center' }),
        label(t, '홍길동', { x: t.u(16), y: t.u(94), width: t.u(68), height: t.u(10) }, t.u(5), { align: 'center' }),
        body(t, '2026년 3월 23일 · 스튜디오랩', { x: t.u(16), y: t.u(116), width: t.u(68), height: t.u(8) }, t.u(2.6), { align: 'center' }),
      ]),
    ],
  },
  {
    id: 'print-notice',
    label: '공지문',
    category: '인쇄',
    ...A4,
    build: (t) => [
      page('공지', t.palette.bg, [
        panel(t, { x: t.u(8), y: t.u(10), width: t.u(84), height: t.u(16) }, t.u(1.5), t.palette.accent),
        display(t, '공지', { x: t.u(8), y: t.u(14), width: t.u(84), height: t.u(10) }, t.u(6), { align: 'center', color: t.palette.onAccent }),
        display(t, '운영 시간이\n바뀝니다', { x: t.u(12), y: t.u(34), width: t.u(76), height: t.u(20) }, t.u(8)),
        body(t, '3월 1일부터 평일 운영 시간이 오전 10시 — 오후 7시로 바뀝니다. 주말은 기존과 같습니다.', { x: t.u(12), y: t.u(60), width: t.u(76), height: t.u(16) }, t.u(3)),
        rule(t, { x: t.u(12), y: t.u(82), width: t.u(76), height: t.u(0.25) }),
        body(t, '문의  02-1234-5678', { x: t.u(12), y: t.u(88), width: t.u(76), height: t.u(8) }, t.u(2.6)),
      ]),
    ],
  },
];
