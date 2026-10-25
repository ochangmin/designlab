/** Marketing templates: banners, link previews and recruitment posts. */

import { createIcon, createShape, createText } from '../elements.js';
import { design, iconPath, page, type TemplateDefinition } from '../templateBuilders.js';
import type { Design } from '../document.js';

/** A wide coupon with a tear line and a code. */
const coupon = (): Design =>
  design('할인 쿠폰', 1600, 500, ['#2b1331', '#e2456b', '#ffd166', '#fff3e2', '#ffffff'], [
    page('쿠폰', { kind: 'solid', color: '#fff3e2' }, [
      createShape('rectangle', { x: 60, y: 60, width: 1480, height: 380 }, {
        fill: { kind: 'solid', color: '#ffffff' },
        radius: 24,
        shadow: { enabled: true, color: 'rgba(43,19,49,0.18)', blur: 48, offsetX: 0, offsetY: 14 },
      }),
      createShape('line', { x: 1080, y: 100, width: 3, height: 300 }, {
        stroke: { color: '#e9d5c2', width: 3, dash: 18 },
        rotation: 90,
      }),
      createText('첫 주문 20% 할인', { x: 130, y: 150, width: 860, height: 110 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 76,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#2b1331',
      }),
      createText('3월 31일까지 · 1인 1회', { x: 130, y: 280, width: 860, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 32,
        fontWeight: 400,
        color: '#7a6a63',
      }),
      createText('CODE', { x: 1130, y: 170, width: 380, height: 50 }, {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 8,
        align: 'center',
        color: '#b9a99f',
      }),
      createText('SPRING20', { x: 1130, y: 220, width: 380, height: 80 }, {
        fontFamily: 'Space Mono',
        fontSize: 54,
        fontWeight: 700,
        align: 'center',
        color: '#e2456b',
      }),
    ]),
  ]);

/** A link preview card, sized for Open Graph. */
const launchCard = (): Design =>
  design('제품 출시 카드', 1200, 630, ['#0b1021', '#6d5efc', '#a5b4fc', '#f4f5ff', '#ffffff'], [
    page('카드', { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 130 }, [
      createShape('ellipse', { x: 880, y: -120, width: 460, height: 460 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#f472b6', angle: 140 },
        opacity: 0.8,
      }),
      createText('NEW', { x: 80, y: 90, width: 220, height: 56 }, {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 8,
        color: '#a5b4fc',
      }),
      createText('이제 브라우저에서\n바로 디자인하세요', { x: 80, y: 180, width: 760, height: 250 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 66,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createText('designlab.app', { x: 80, y: 480, width: 500, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 30,
        fontWeight: 600,
        letterSpacing: 2,
        color: '#a5b4fc',
      }),
    ]),
  ]);

/** A newsletter masthead. */
const newsletterHeader = (): Design =>
  design('뉴스레터 헤더', 1600, 500, ['#1b1b1f', '#8a7a5c', '#d8cdb4', '#fdfaf4', '#ffffff'], [
    page('헤더', { kind: 'solid', color: '#fdfaf4' }, [
      createText('THE WEEKLY', { x: 100, y: 140, width: 900, height: 70 }, {
        fontFamily: 'Inter',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 12,
        color: '#8a7a5c',
      }),
      createText('이번 주의 디자인', { x: 100, y: 210, width: 1000, height: 130 }, {
        fontFamily: 'Playfair Display',
        fontSize: 92,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#1b1b1f',
      }),
      createShape('line', { x: 100, y: 370, width: 1400, height: 3 }, {
        stroke: { color: '#1b1b1f', width: 3, dash: 0 },
      }),
      createText('3월 둘째 주 · 12호', { x: 100, y: 395, width: 1400, height: 50 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 30,
        fontWeight: 400,
        align: 'right',
        color: '#6b6b73',
      }),
      createIcon('잎', iconPath('leaf'), { x: 1360, y: 130, width: 140, height: 140 }, {
        color: '#d8cdb4',
      }),
    ]),
  ]);

/** A video thumbnail for a talk or a webinar. */
const webinarThumb = (): Design =>
  design('웨비나 썸네일', 1280, 720, ['#06212e', '#13a3b5', '#8be0e6', '#ffd166', '#ffffff'], [
    page('썸네일', { kind: 'gradient', from: '#06212e', to: '#0b4f63', angle: 140 }, [
      createShape('rectangle', { x: 70, y: 90, width: 260, height: 70 }, {
        fill: { kind: 'solid', color: '#ffd166' },
        radius: 35,
      }),
      createText('무료 웨비나', { x: 70, y: 108, width: 260, height: 40 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 28,
        fontWeight: 700,
        align: 'center',
        color: '#06212e',
      }),
      createText('디자인 시스템\n처음 만들기', { x: 70, y: 210, width: 820, height: 290 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 96,
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: -3,
        color: '#ffffff',
      }),
      createText('3월 21일 목요일 저녁 8시', { x: 70, y: 540, width: 820, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 36,
        fontWeight: 400,
        color: '#8be0e6',
      }),
      createShape('ellipse', { x: 960, y: 230, width: 240, height: 240 }, {
        fill: { kind: 'solid', color: '#13a3b5' },
      }),
      createIcon('재생', iconPath('play'), { x: 1035, y: 300, width: 100, height: 100 }, {
        color: '#ffffff',
      }),
    ]),
  ]);

/** A recruitment post for a feed. */
const hiringPost = (): Design =>
  design('채용 공고', 1080, 1350, ['#111827', '#6d5efc', '#a5b4fc', '#f4f5ff', '#ffffff'], [
    page('공고', { kind: 'solid', color: '#ffffff' }, [
      createShape('rectangle', { x: 0, y: 0, width: 1080, height: 420 }, {
        fill: { kind: 'gradient', from: '#111827', to: '#2a3568', angle: 140 },
        radius: 0,
      }),
      createText("WE'RE HIRING", { x: 80, y: 130, width: 700, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 10,
        color: '#a5b4fc',
      }),
      createText('프로덕트 디자이너', { x: 80, y: 210, width: 900, height: 120 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 76,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createText(
        '하는 일\n제품의 화면과 흐름을 설계하고, 만들어진 결과를 직접 확인합니다.\n\n찾는 분\n· 완성까지 책임지는 분\n· 근거로 설명할 수 있는 분\n· 작은 디테일을 끝까지 보는 분',
        { x: 80, y: 500, width: 920, height: 560 },
        { fontFamily: 'Noto Sans KR', fontSize: 36, fontWeight: 400, lineHeight: 1.75, color: '#374151' },
      ),
      createShape('rectangle', { x: 80, y: 1120, width: 480, height: 110 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
        radius: 55,
      }),
      createText('지원하기', { x: 80, y: 1152, width: 480, height: 56 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 700,
        align: 'center',
        color: '#ffffff',
      }),
    ]),
  ]);

export const MARKETING_TEMPLATES: readonly TemplateDefinition[] = [
  { id: 'coupon', label: '할인 쿠폰', category: '마케팅', build: coupon },
  { id: 'launch-card', label: '제품 출시 카드', category: '마케팅', build: launchCard },
  { id: 'newsletter-header', label: '뉴스레터 헤더', category: '마케팅', build: newsletterHeader },
  { id: 'webinar-thumb', label: '웨비나 썸네일', category: '마케팅', build: webinarThumb },
  { id: 'hiring-post', label: '채용 공고', category: '마케팅', build: hiringPost },
];
