/** Presentation templates: multi-slide decks at 1920 × 1080. */

import { createShape, createText } from '../elements.js';
import { design, page, type TemplateDefinition } from '../templateBuilders.js';
import type { Design, DesignElement } from '../document.js';

const DARK = ['#0b1021', '#6d5efc', '#a5b4fc', '#f4f5ff', '#ffffff'];

/** A statistic with its label, the unit a metrics slide repeats. */
const stat = (x: number, value: string, label: string, color: string): readonly DesignElement[] => [
  createText(value, { x, y: 420, width: 400, height: 170 }, {
    fontFamily: 'Montserrat',
    fontSize: 140,
    fontWeight: 800,
    letterSpacing: -6,
    color,
  }),
  createText(label, { x, y: 610, width: 400, height: 70 }, {
    fontFamily: 'Noto Sans KR',
    fontSize: 32,
    fontWeight: 500,
    color: '#4b5168',
  }),
];

/** Problem, solution, traction, team — the shape an investor expects. */
const pitchDeck = (): Design =>
  design('피치덱 5장', 1920, 1080, DARK, [
    page('표지', { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 150 }, [
      createText('스튜디오랩', { x: 160, y: 380, width: 1200, height: 180 }, {
        fontFamily: 'Montserrat',
        fontSize: 132,
        fontWeight: 800,
        letterSpacing: -4,
        color: '#ffffff',
      }),
      createText('누구나 30분 안에 쓸 만한 디자인을 만든다', { x: 160, y: 580, width: 1300, height: 90 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 48,
        fontWeight: 400,
        color: '#a5b4fc',
      }),
      createShape('rectangle', { x: 160, y: 740, width: 200, height: 10 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#f472b6', angle: 90 },
        radius: 5,
      }),
      createText('2026년 3월 · 시리즈 A', { x: 160, y: 880, width: 800, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: 4,
        color: '#6f7ba8',
        uppercase: true,
      }),
    ]),
    page('문제', { kind: 'solid', color: '#ffffff' }, [
      createText('문제', { x: 160, y: 140, width: 600, height: 100 }, {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 8,
        color: '#8e92a4',
        uppercase: true,
      }),
      createText('디자인 도구는 전문가를 위해\n설계되어 있다', { x: 160, y: 260, width: 1400, height: 300 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 88,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createText(
        '소상공인과 1인 창작자는 한 장의 포스터를 위해 몇 시간을 씁니다. 배워야 할 개념이 만들려는 결과물보다 많습니다.',
        { x: 160, y: 620, width: 1200, height: 220 },
        { fontFamily: 'Noto Sans KR', fontSize: 40, fontWeight: 400, lineHeight: 1.75, color: '#4b5168' },
      ),
    ]),
    page('해결', { kind: 'solid', color: '#f4f5ff' }, [
      createText('해결', { x: 160, y: 140, width: 600, height: 100 }, {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 8,
        color: '#6d5efc',
        uppercase: true,
      }),
      createText('템플릿에서 시작해\n고치기만 하면 되도록', { x: 160, y: 260, width: 1400, height: 300 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 88,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createShape('rectangle', { x: 160, y: 640, width: 500, height: 260 }, {
        fill: { kind: 'solid', color: '#ffffff' },
        radius: 20,
      }),
      createText('완성된 시작점', { x: 200, y: 700, width: 420, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 700,
        color: '#0b1021',
      }),
      createText('고르는 순간 이미 끝나 있는 레이아웃', { x: 200, y: 780, width: 420, height: 100 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 28,
        fontWeight: 400,
        lineHeight: 1.6,
        color: '#4b5168',
      }),
      createShape('rectangle', { x: 710, y: 640, width: 500, height: 260 }, {
        fill: { kind: 'solid', color: '#ffffff' },
        radius: 20,
      }),
      createText('보이는 대로 출력', { x: 750, y: 700, width: 420, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 700,
        color: '#0b1021',
      }),
      createText('화면과 인쇄물이 어긋나지 않음', { x: 750, y: 780, width: 420, height: 100 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 28,
        fontWeight: 400,
        lineHeight: 1.6,
        color: '#4b5168',
      }),
      createShape('rectangle', { x: 1260, y: 640, width: 500, height: 260 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
        radius: 20,
      }),
      createText('설치 없음', { x: 1300, y: 700, width: 420, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 700,
        color: '#ffffff',
      }),
      createText('브라우저만 있으면 바로 시작', { x: 1300, y: 780, width: 420, height: 100 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 28,
        fontWeight: 400,
        lineHeight: 1.6,
        color: '#ddd9ff',
      }),
    ]),
    page('지표', { kind: 'solid', color: '#ffffff' }, [
      createText('지금까지', { x: 160, y: 140, width: 900, height: 120 }, {
        fontFamily: 'Montserrat',
        fontSize: 76,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createShape('line', { x: 160, y: 340, width: 1600, height: 3 }, {
        stroke: { color: '#e3e4ec', width: 2, dash: 0 },
      }),
      ...stat(160, '12,400', '누적 사용자', '#6d5efc'),
      ...stat(740, '38%', '주간 재방문율', '#0b1021'),
      ...stat(1320, '4.6', '평균 만족도 (5점)', '#f472b6'),
    ]),
    page('팀', { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 150 }, [
      createText('함께 만드는 사람들', { x: 160, y: 180, width: 1200, height: 120 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 76,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createShape('ellipse', { x: 160, y: 400, width: 200, height: 200 }, {
        fill: { kind: 'solid', color: '#2f3b74' },
      }),
      createText('김하늘\n대표 · 디자인', { x: 160, y: 630, width: 200, height: 140 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 500,
        align: 'center',
        lineHeight: 1.6,
        color: '#a5b4fc',
      }),
      createShape('ellipse', { x: 460, y: 400, width: 200, height: 200 }, {
        fill: { kind: 'solid', color: '#2f3b74' },
      }),
      createText('이도윤\n엔지니어링', { x: 460, y: 630, width: 200, height: 140 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 500,
        align: 'center',
        lineHeight: 1.6,
        color: '#a5b4fc',
      }),
      createShape('ellipse', { x: 760, y: 400, width: 200, height: 200 }, {
        fill: { kind: 'solid', color: '#2f3b74' },
      }),
      createText('박서진\n그로스', { x: 760, y: 630, width: 200, height: 140 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 500,
        align: 'center',
        lineHeight: 1.6,
        color: '#a5b4fc',
      }),
    ]),
  ]);

/** A monthly review: summary, numbers, what is next. */
const monthlyReport = (): Design =>
  design('월간 보고 4장', 1920, 1080, DARK, [
    page('표지', { kind: 'solid', color: '#f4f5ff' }, [
      createText('3월 운영 보고', { x: 160, y: 400, width: 1200, height: 160 }, {
        fontFamily: 'Montserrat',
        fontSize: 118,
        fontWeight: 800,
        letterSpacing: -3,
        color: '#0b1021',
      }),
      createText('프로덕트팀 · 2026년 4월 1일', { x: 160, y: 590, width: 900, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 38,
        fontWeight: 400,
        color: '#4b5168',
      }),
    ]),
    page('요약', { kind: 'solid', color: '#ffffff' }, [
      createText('한 줄 요약', { x: 160, y: 140, width: 900, height: 110 }, {
        fontFamily: 'Montserrat',
        fontSize: 72,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createText(
        '신규 가입은 목표를 넘었고, 첫 디자인 완성률이 처음으로 50%를 넘었습니다. 반대로 재방문은 제자리였습니다.',
        { x: 160, y: 320, width: 1500, height: 260 },
        { fontFamily: 'Noto Sans KR', fontSize: 48, fontWeight: 400, lineHeight: 1.7, color: '#1f2a53' },
      ),
      createShape('rectangle', { x: 160, y: 640, width: 1600, height: 220 }, {
        fill: { kind: 'solid', color: '#f4f5ff' },
        radius: 20,
      }),
      createText(
        '다음 달에 바꿀 것 — 두 번째 방문에서 무엇을 보여줄지 정하지 않았습니다. 돌아온 사람을 위한 첫 화면을 만듭니다.',
        { x: 220, y: 700, width: 1480, height: 120 },
        { fontFamily: 'Noto Sans KR', fontSize: 36, fontWeight: 500, lineHeight: 1.6, color: '#1f2a53' },
      ),
    ]),
    page('지표', { kind: 'solid', color: '#ffffff' }, [
      createText('숫자', { x: 160, y: 140, width: 900, height: 110 }, {
        fontFamily: 'Montserrat',
        fontSize: 72,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createShape('line', { x: 160, y: 340, width: 1600, height: 3 }, {
        stroke: { color: '#e3e4ec', width: 2, dash: 0 },
      }),
      ...stat(160, '+1,820', '신규 가입', '#6d5efc'),
      ...stat(740, '52%', '첫 디자인 완성률', '#3f9a6a'),
      ...stat(1320, '-2%', '주간 재방문', '#e2456b'),
    ]),
    page('계획', { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 150 }, [
      createText('4월 계획', { x: 160, y: 180, width: 1000, height: 130 }, {
        fontFamily: 'Montserrat',
        fontSize: 86,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createText(
        '01   돌아온 사용자를 위한 시작 화면\n02   템플릿 20종 추가\n03   내보내기 속도 개선',
        { x: 160, y: 420, width: 1400, height: 420 },
        { fontFamily: 'Noto Sans KR', fontSize: 54, fontWeight: 500, lineHeight: 2, color: '#dcdaff' },
      ),
    ]),
  ]);

/** Lecture slides: a title, a definition, an example, a summary. */
const lectureDeck = (): Design =>
  design('강의 슬라이드 4장', 1920, 1080, ['#1b1b1f', '#8a7a5c', '#d8cdb4', '#fdfaf4', '#ffffff'], [
    page('표지', { kind: 'solid', color: '#1b1b1f' }, [
      createText('3강', { x: 160, y: 300, width: 600, height: 110 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 54,
        fontWeight: 400,
        letterSpacing: 8,
        color: '#8a7a5c',
      }),
      createText('타이포그래피의\n기본', { x: 160, y: 420, width: 1400, height: 380 }, {
        fontFamily: 'Playfair Display',
        fontSize: 140,
        fontWeight: 700,
        lineHeight: 1.1,
        color: '#fdfaf4',
      }),
    ]),
    page('정의', { kind: 'solid', color: '#fdfaf4' }, [
      createText('정의', { x: 160, y: 150, width: 600, height: 90 }, {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 10,
        color: '#8a7a5c',
        uppercase: true,
      }),
      createText('타이포그래피는 글자를 고르는 일이 아니라\n읽는 순서를 설계하는 일이다', {
        x: 160,
        y: 280,
        width: 1600,
        height: 300,
      }, {
        fontFamily: 'Playfair Display',
        fontSize: 82,
        fontWeight: 400,
        lineHeight: 1.35,
        color: '#1b1b1f',
      }),
      createShape('line', { x: 160, y: 660, width: 300, height: 3 }, {
        stroke: { color: '#1b1b1f', width: 3, dash: 0 },
      }),
      createText('크기 · 굵기 · 간격 · 정렬', { x: 160, y: 710, width: 1200, height: 70 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 40,
        fontWeight: 400,
        letterSpacing: 4,
        color: '#6b6b73',
      }),
    ]),
    page('예시', { kind: 'solid', color: '#ffffff' }, [
      createText('같은 문장, 다른 위계', { x: 160, y: 140, width: 1200, height: 110 }, {
        fontFamily: 'Playfair Display',
        fontSize: 72,
        fontWeight: 700,
        color: '#1b1b1f',
      }),
      createShape('rectangle', { x: 160, y: 320, width: 760, height: 520 }, {
        fill: { kind: 'solid', color: '#f4f4f5' },
        radius: 16,
      }),
      createText('봄 특별전\n3월 1일부터\n성수 스테이션', { x: 220, y: 400, width: 640, height: 340 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 44,
        fontWeight: 400,
        lineHeight: 1.7,
        color: '#1b1b1f',
      }),
      createShape('rectangle', { x: 1000, y: 320, width: 760, height: 520 }, {
        fill: { kind: 'solid', color: '#1b1b1f' },
        radius: 16,
      }),
      createText('봄 특별전', { x: 1060, y: 400, width: 640, height: 120 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 84,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#fdfaf4',
      }),
      createText('3월 1일부터\n성수 스테이션', { x: 1060, y: 560, width: 640, height: 200 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 36,
        fontWeight: 400,
        lineHeight: 1.7,
        color: '#d8cdb4',
      }),
    ]),
    page('정리', { kind: 'solid', color: '#1b1b1f' }, [
      createText('오늘 기억할 것', { x: 160, y: 200, width: 1200, height: 120 }, {
        fontFamily: 'Playfair Display',
        fontSize: 86,
        fontWeight: 700,
        color: '#fdfaf4',
      }),
      createText(
        '하나 — 크기는 네 단계면 충분하다\n둘 — 줄 길이는 45–75자\n셋 — 같은 역할에는 같은 서식',
        { x: 160, y: 430, width: 1500, height: 400 },
        { fontFamily: 'Gowun Batang', fontSize: 56, fontWeight: 400, lineHeight: 1.95, color: '#d8cdb4' },
      ),
    ]),
  ]);

/** A single slide of numbers, for a stand-up or a board update. */
const metricsSlide = (): Design =>
  design('지표 한 장', 1920, 1080, DARK, [
    page('지표', { kind: 'solid', color: '#ffffff' }, [
      createText('이번 분기 요약', { x: 160, y: 130, width: 1200, height: 120 }, {
        fontFamily: 'Montserrat',
        fontSize: 80,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createShape('line', { x: 160, y: 330, width: 1600, height: 3 }, {
        stroke: { color: '#e3e4ec', width: 2, dash: 0 },
      }),
      ...stat(160, '₩48M', '분기 매출', '#6d5efc'),
      ...stat(740, '1,240', '유료 전환', '#0b1021'),
      ...stat(1320, '94%', '유지율', '#3f9a6a'),
      createShape('rectangle', { x: 160, y: 760, width: 1600, height: 160 }, {
        fill: { kind: 'solid', color: '#f4f5ff' },
        radius: 20,
      }),
      createText('목표 대비 112% · 다음 분기 목표 ₩55M', { x: 220, y: 810, width: 1480, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 500,
        color: '#1f2a53',
      }),
    ]),
  ]);

export const PRESENTATION_TEMPLATES: readonly TemplateDefinition[] = [
  { id: 'pitch-deck', label: '피치덱 5장', category: '프레젠테이션', build: pitchDeck },
  { id: 'monthly-report', label: '월간 보고 4장', category: '프레젠테이션', build: monthlyReport },
  { id: 'lecture-deck', label: '강의 슬라이드 4장', category: '프레젠테이션', build: lectureDeck },
  { id: 'metrics-slide', label: '지표 한 장', category: '프레젠테이션', build: metricsSlide },
];
