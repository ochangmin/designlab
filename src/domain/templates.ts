/**
 * Starter documents.
 *
 * A template is a function that produces a complete `Design` with fresh
 * identity, built from the same element factories the editor uses. There is no
 * separate template format to keep in step, and a template thumbnail is the
 * real document rendered small.
 */

import { createIcon, createShape, createText } from './elements.js';
import { createId } from './ids.js';
import { findIcon } from './icons.js';
import { SCHEMA_VERSION, type Design, type DesignElement, type Page, type Paint } from './document.js';

const page = (name: string, background: Paint, elements: readonly DesignElement[]): Page => ({
  id: createId('pg'),
  name,
  background,
  elements,
});

const design = (
  name: string,
  width: number,
  height: number,
  palette: readonly string[],
  pages: readonly Page[],
): Design => {
  const now = Date.now();
  return {
    id: createId('dsn'),
    schemaVersion: SCHEMA_VERSION,
    name,
    width,
    height,
    pages,
    palette,
    createdAt: now,
    updatedAt: now,
  };
};

const iconPath = (id: string): string => findIcon(id)?.pathData ?? '';

export interface TemplateDefinition {
  readonly id: string;
  readonly label: string;
  readonly category: '소셜' | '프레젠테이션' | '인쇄' | '마케팅';
  readonly build: () => Design;
}

export const createBlankDesign = (name: string, width: number, height: number): Design =>
  design(name, width, height, ['#111827', '#6d5efc', '#f472b6', '#f4f4f5', '#ffffff'], [
    page('페이지 1', { kind: 'solid', color: '#ffffff' }, []),
  ]);

const boldSale = (): Design =>
  design('여름 세일 포스트', 1080, 1080, ['#1b0b3b', '#6d5efc', '#ff72c6', '#ffd166', '#ffffff'], [
    page('포스트', { kind: 'gradient', from: '#2d1b4e', to: '#6d3ad1', angle: 150 }, [
      createShape('ellipse', { x: 640, y: -140, width: 620, height: 620 }, {
        fill: { kind: 'gradient', from: '#ff72c6', to: '#ffd166', angle: 120 },
        opacity: 0.85,
      }),
      createShape('ellipse', { x: -180, y: 700, width: 480, height: 480 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
        opacity: 0.55,
      }),
      createText('SUMMER SALE', { x: 96, y: 150, width: 560, height: 40 }, {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 8,
        color: '#ffd166',
        uppercase: true,
      }),
      createText('최대 50%\n할인', { x: 96, y: 226, width: 720, height: 340 }, {
        fontFamily: 'Montserrat',
        fontSize: 148,
        fontWeight: 800,
        letterSpacing: -4,
        lineHeight: 1,
        color: '#ffffff',
      }),
      createText('7월 1일부터 7월 14일까지\n전 품목 적용', { x: 96, y: 600, width: 620, height: 120 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 32,
        fontWeight: 400,
        lineHeight: 1.55,
        color: '#e7e4ff',
      }),
      createShape('rectangle', { x: 96, y: 790, width: 360, height: 96 }, {
        fill: { kind: 'solid', color: '#ffffff' },
        radius: 48,
      }),
      createText('지금 쇼핑하기', { x: 96, y: 818, width: 360, height: 44 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 700,
        align: 'center',
        color: '#2d1b4e',
      }),
    ]),
  ]);

const minimalQuote = (): Design =>
  design('인용 카드', 1080, 1080, ['#111111', '#8a8a93', '#d4d4d8', '#fafafa', '#ffffff'], [
    page('카드', { kind: 'solid', color: '#fafaf7' }, [
      createText('“', { x: 110, y: 120, width: 200, height: 220 }, {
        fontFamily: 'Playfair Display',
        fontSize: 220,
        fontWeight: 700,
        color: '#d9d4c7',
      }),
      createText('좋은 디자인은\n설명이 필요하지 않다.', { x: 120, y: 330, width: 840, height: 300 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 76,
        fontWeight: 700,
        lineHeight: 1.35,
        color: '#1b1b1f',
      }),
      createShape('line', { x: 120, y: 690, width: 160, height: 4 }, {
        stroke: { color: '#1b1b1f', width: 3, dash: 0 },
      }),
      createText('디터 람스', { x: 120, y: 730, width: 400, height: 48 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 28,
        fontWeight: 500,
        letterSpacing: 2,
        color: '#6b6b73',
      }),
      createIcon('별', iconPath('star'), { x: 880, y: 860, width: 72, height: 72 }, { color: '#d9d4c7' }),
    ]),
  ]);

const eventPoster = (): Design =>
  design('이벤트 포스터', 1587, 2245, ['#06212e', '#13a3b5', '#8be0e6', '#ffd166', '#ffffff'], [
    page('포스터', { kind: 'solid', color: '#06212e' }, [
      createShape('rectangle', { x: 0, y: 1500, width: 1587, height: 745 }, {
        fill: { kind: 'gradient', from: '#13a3b5', to: '#06212e', angle: 0 },
        radius: 0,
        opacity: 0.6,
      }),
      createShape('ellipse', { x: 980, y: 180, width: 480, height: 480 }, {
        fill: { kind: 'solid', color: '#ffd166' },
        opacity: 0.9,
      }),
      createText('2026 . 03 . 14', { x: 140, y: 200, width: 700, height: 60 }, {
        fontFamily: 'Space Mono',
        fontSize: 40,
        fontWeight: 700,
        letterSpacing: 6,
        color: '#8be0e6',
      }),
      createText('디자인\n컨퍼런스', { x: 140, y: 320, width: 1100, height: 560 }, {
        fontFamily: 'Montserrat',
        fontSize: 220,
        fontWeight: 800,
        letterSpacing: -8,
        lineHeight: 0.98,
        color: '#ffffff',
      }),
      createText('서울 성수 디자인 스테이션 · 오후 1시 — 7시', { x: 140, y: 960, width: 1100, height: 80 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 42,
        fontWeight: 400,
        color: '#c9f0f4',
      }),
      createShape('line', { x: 140, y: 1100, width: 1300, height: 4 }, {
        stroke: { color: '#13a3b5', width: 4, dash: 0 },
      }),
      createText('초청 연사\n\n김하늘 — 브랜드 디렉터\n이도윤 — 프로덕트 디자이너\n박서진 — 모션 디자이너', {
        x: 140,
        y: 1180,
        width: 900,
        height: 420,
      }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 400,
        lineHeight: 1.7,
        color: '#ffffff',
      }),
      createShape('rectangle', { x: 140, y: 1900, width: 520, height: 120 }, {
        fill: { kind: 'solid', color: '#ffd166' },
        radius: 60,
      }),
      createText('참가 신청', { x: 140, y: 1936, width: 520, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 44,
        fontWeight: 700,
        align: 'center',
        color: '#06212e',
      }),
    ]),
  ]);

const thumbnail = (): Design =>
  design('유튜브 썸네일', 1280, 720, ['#111111', '#ef4444', '#facc15', '#ffffff', '#27272a'], [
    page('썸네일', { kind: 'gradient', from: '#1b1b1f', to: '#3f1016', angle: 120 }, [
      createShape('rectangle', { x: 700, y: 60, width: 520, height: 600 }, {
        fill: { kind: 'gradient', from: '#ef4444', to: '#facc15', angle: 160 },
        radius: 32,
        opacity: 0.9,
      }),
      createText('이 기능\n하나로', { x: 70, y: 110, width: 600, height: 300 }, {
        fontFamily: 'Montserrat',
        fontSize: 118,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: -3,
        color: '#ffffff',
      }),
      createText('작업 시간 90% 절감', { x: 70, y: 440, width: 620, height: 90 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 54,
        fontWeight: 700,
        color: '#facc15',
      }),
      createShape('rectangle', { x: 70, y: 560, width: 300, height: 80 }, {
        fill: { kind: 'solid', color: '#ef4444' },
        radius: 16,
      }),
      createText('실전 데모', { x: 70, y: 583, width: 300, height: 44 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 700,
        align: 'center',
        color: '#ffffff',
      }),
      createIcon('재생', iconPath('play'), { x: 900, y: 270, width: 140, height: 140 }, { color: '#ffffff' }),
    ]),
  ]);

const deck = (): Design =>
  design('프레젠테이션', 1920, 1080, ['#0b1021', '#6d5efc', '#a5b4fc', '#f4f5ff', '#ffffff'], [
    page('표지', { kind: 'solid', color: '#0b1021' }, [
      createShape('rectangle', { x: 0, y: 0, width: 18, height: 1080 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#a5b4fc', angle: 180 },
        radius: 0,
      }),
      createText('2026 제품 전략', { x: 160, y: 360, width: 1200, height: 160 }, {
        fontFamily: 'Montserrat',
        fontSize: 118,
        fontWeight: 800,
        letterSpacing: -3,
        color: '#ffffff',
      }),
      createText('성장과 리텐션을 위한 세 가지 축', { x: 160, y: 540, width: 1100, height: 80 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 44,
        fontWeight: 400,
        color: '#a5b4fc',
      }),
      createText('프로덕트팀 · 2026년 1월', { x: 160, y: 860, width: 700, height: 50 }, {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 500,
        letterSpacing: 4,
        color: '#6f7ba8',
        uppercase: true,
      }),
      createShape('ellipse', { x: 1450, y: 180, width: 360, height: 360 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#f472b6', angle: 135 },
        opacity: 0.75,
      }),
    ]),
    page('목차', { kind: 'solid', color: '#f4f5ff' }, [
      createText('오늘 다룰 내용', { x: 160, y: 140, width: 900, height: 110 }, {
        fontFamily: 'Montserrat',
        fontSize: 76,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createShape('line', { x: 160, y: 290, width: 1600, height: 3 }, {
        stroke: { color: '#c7cdf2', width: 2, dash: 0 },
      }),
      createText('01   시장과 사용자 변화\n02   핵심 지표 리뷰\n03   올해의 세 가지 베팅\n04   실행 로드맵', {
        x: 160,
        y: 360,
        width: 1300,
        height: 460,
      }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 54,
        fontWeight: 500,
        lineHeight: 1.9,
        color: '#1f2a53',
      }),
    ]),
    page('섹션 구분', { kind: 'solid', color: '#0b1021' }, [
      createText('01', { x: 160, y: 300, width: 500, height: 300 }, {
        fontFamily: 'Montserrat',
        fontSize: 260,
        fontWeight: 800,
        letterSpacing: -10,
        color: '#2a3568',
      }),
      createText('시장과 사용자 변화', { x: 160, y: 620, width: 1200, height: 140 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 92,
        fontWeight: 700,
        color: '#ffffff',
      }),
      createShape('rectangle', { x: 160, y: 800, width: 220, height: 10 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#a5b4fc', angle: 90 },
        radius: 5,
      }),
    ]),
    page('본문 2단', { kind: 'solid', color: '#ffffff' }, [
      createText('무엇이 달라졌나', { x: 160, y: 130, width: 1200, height: 110 }, {
        fontFamily: 'Montserrat',
        fontSize: 72,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createShape('rectangle', { x: 160, y: 300, width: 60, height: 8 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
        radius: 4,
      }),
      createText('사용자', { x: 160, y: 350, width: 700, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 44,
        fontWeight: 700,
        color: '#0b1021',
      }),
      createText(
        '모바일에서 먼저 열어보고, 결정은 데스크톱에서 합니다. 첫 화면에서 결과를 보여주지 못하면 다음 단계로 넘어가지 않습니다.',
        { x: 160, y: 440, width: 700, height: 300 },
        { fontFamily: 'Noto Sans KR', fontSize: 34, fontWeight: 400, lineHeight: 1.75, color: '#4b5168' },
      ),
      createShape('rectangle', { x: 1020, y: 300, width: 60, height: 8 }, {
        fill: { kind: 'solid', color: '#f472b6' },
        radius: 4,
      }),
      createText('시장', { x: 1020, y: 350, width: 700, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 44,
        fontWeight: 700,
        color: '#0b1021',
      }),
      createText(
        '경쟁 제품이 무료 구간을 넓히면서, 가격이 아니라 완성까지 걸리는 시간이 선택 기준이 되었습니다.',
        { x: 1020, y: 440, width: 700, height: 300 },
        { fontFamily: 'Noto Sans KR', fontSize: 34, fontWeight: 400, lineHeight: 1.75, color: '#4b5168' },
      ),
    ]),
    page('수치', { kind: 'solid', color: '#f4f5ff' }, [
      createText('핵심 지표', { x: 160, y: 130, width: 900, height: 110 }, {
        fontFamily: 'Montserrat',
        fontSize: 72,
        fontWeight: 800,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createText('+42%', { x: 160, y: 420, width: 480, height: 180 }, {
        fontFamily: 'Montserrat',
        fontSize: 150,
        fontWeight: 800,
        letterSpacing: -6,
        color: '#6d5efc',
      }),
      createText('주간 활성 사용자', { x: 160, y: 620, width: 480, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 500,
        color: '#4b5168',
      }),
      createText('2.4배', { x: 740, y: 420, width: 480, height: 180 }, {
        fontFamily: 'Montserrat',
        fontSize: 150,
        fontWeight: 800,
        letterSpacing: -6,
        color: '#0b1021',
      }),
      createText('첫 디자인 완성률', { x: 740, y: 620, width: 480, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 500,
        color: '#4b5168',
      }),
      createText('18일', { x: 1320, y: 420, width: 480, height: 180 }, {
        fontFamily: 'Montserrat',
        fontSize: 150,
        fontWeight: 800,
        letterSpacing: -6,
        color: '#f472b6',
      }),
      createText('평균 재방문 주기', { x: 1320, y: 620, width: 480, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 500,
        color: '#4b5168',
      }),
      createShape('line', { x: 160, y: 360, width: 1600, height: 3 }, {
        stroke: { color: '#c7cdf2', width: 2, dash: 0 },
      }),
    ]),
    page('마무리', { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 150 }, [
      createText('감사합니다', { x: 160, y: 420, width: 1200, height: 180 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 128,
        fontWeight: 700,
        letterSpacing: -4,
        color: '#ffffff',
      }),
      createText('질문은 언제든 편하게 — product@studio.kr', { x: 160, y: 640, width: 1200, height: 70 }, {
        fontFamily: 'Inter',
        fontSize: 36,
        fontWeight: 400,
        color: '#a5b4fc',
      }),
      createIcon('반짝임', iconPath('star'), { x: 1560, y: 760, width: 140, height: 140 }, { color: '#2a3568' }),
    ]),
  ]);

/** A lighter, type-led deck for talks and lecture notes. */
const editorialDeck = (): Design =>
  design('에디토리얼 프레젠테이션', 1920, 1080, ['#1b1b1f', '#8a7a5c', '#d8cdb4', '#fdfaf4', '#ffffff'], [
    page('표지', { kind: 'solid', color: '#fdfaf4' }, [
      createText('DESIGN NOTES', { x: 180, y: 200, width: 700, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 10,
        color: '#8a7a5c',
        uppercase: true,
      }),
      createText('좋은 인터페이스는\n설명을 줄인다', { x: 180, y: 320, width: 1400, height: 400 }, {
        fontFamily: 'Playfair Display',
        fontSize: 140,
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: -2,
        color: '#1b1b1f',
      }),
      createShape('line', { x: 180, y: 800, width: 400, height: 3 }, {
        stroke: { color: '#1b1b1f', width: 3, dash: 0 },
      }),
      createText('2026년 3월 · 디자인 세미나', { x: 180, y: 840, width: 800, height: 60 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 34,
        fontWeight: 400,
        color: '#6b6b73',
      }),
    ]),
    page('목차', { kind: 'solid', color: '#ffffff' }, [
      createText('차례', { x: 180, y: 160, width: 600, height: 120 }, {
        fontFamily: 'Playfair Display',
        fontSize: 86,
        fontWeight: 700,
        color: '#1b1b1f',
      }),
      createText(
        '하나 — 읽히는 글자\n둘 — 비어 있는 자리\n셋 — 움직임의 예의\n넷 — 덜어내기',
        { x: 180, y: 360, width: 1400, height: 480 },
        { fontFamily: 'Gowun Batang', fontSize: 58, fontWeight: 400, lineHeight: 1.95, color: '#2f2f36' },
      ),
    ]),
    page('섹션', { kind: 'solid', color: '#1b1b1f' }, [
      createText('하나', { x: 180, y: 400, width: 700, height: 160 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 54,
        fontWeight: 400,
        letterSpacing: 8,
        color: '#8a7a5c',
      }),
      createText('읽히는 글자', { x: 180, y: 520, width: 1300, height: 200 }, {
        fontFamily: 'Playfair Display',
        fontSize: 130,
        fontWeight: 700,
        color: '#fdfaf4',
      }),
    ]),
    page('본문', { kind: 'solid', color: '#fdfaf4' }, [
      createText('글자는 장식이 아니라 구조다', { x: 180, y: 160, width: 1300, height: 120 }, {
        fontFamily: 'Playfair Display',
        fontSize: 76,
        fontWeight: 700,
        color: '#1b1b1f',
      }),
      createText(
        '크기를 네 단계로 줄이면 위계가 분명해진다. 같은 역할의 글자가 두 가지 크기로 나타나는 순간, 읽는 사람은 어느 쪽이 중요한지 다시 묻게 된다.\n\n줄 길이는 45자에서 75자 사이로. 그보다 길면 다음 줄을 찾느라 눈이 되돌아가고, 짧으면 호흡이 끊긴다.',
        { x: 180, y: 340, width: 940, height: 520 },
        { fontFamily: 'Gowun Batang', fontSize: 38, fontWeight: 400, lineHeight: 1.85, color: '#2f2f36' },
      ),
      createShape('rectangle', { x: 1240, y: 340, width: 500, height: 520 }, {
        fill: { kind: 'solid', color: '#d8cdb4' },
        radius: 8,
      }),
      createText('이미지 자리', { x: 1240, y: 580, width: 500, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 500,
        align: 'center',
        color: '#7a7059',
      }),
    ]),
    page('인용', { kind: 'solid', color: '#ffffff' }, [
      createText('“', { x: 180, y: 180, width: 300, height: 300 }, {
        fontFamily: 'Playfair Display',
        fontSize: 300,
        fontWeight: 700,
        color: '#d8cdb4',
      }),
      createText('덜어낼 것이 없을 때\n비로소 완성된다', { x: 200, y: 420, width: 1500, height: 320 }, {
        fontFamily: 'Playfair Display',
        fontSize: 110,
        fontWeight: 400,
        lineHeight: 1.25,
        color: '#1b1b1f',
      }),
      createText('생텍쥐페리', { x: 200, y: 800, width: 600, height: 60 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 34,
        fontWeight: 400,
        letterSpacing: 4,
        color: '#8a7a5c',
      }),
    ]),
    page('마무리', { kind: 'solid', color: '#1b1b1f' }, [
      createText('고맙습니다', { x: 180, y: 440, width: 1200, height: 200 }, {
        fontFamily: 'Playfair Display',
        fontSize: 140,
        fontWeight: 700,
        color: '#fdfaf4',
      }),
      createShape('line', { x: 180, y: 700, width: 300, height: 3 }, {
        stroke: { color: '#8a7a5c', width: 3, dash: 0 },
      }),
    ]),
  ]);

const businessCard = (): Design =>
  design('명함', 1050, 600, ['#111827', '#6d5efc', '#d4d4d8', '#ffffff', '#f4f4f5'], [
    page('앞면', { kind: 'solid', color: '#ffffff' }, [
      createShape('rectangle', { x: 0, y: 0, width: 24, height: 600 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
        radius: 0,
      }),
      createText('윤지호', { x: 90, y: 190, width: 500, height: 90 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 64,
        fontWeight: 700,
        color: '#111827',
      }),
      createText('프로덕트 디자이너', { x: 90, y: 290, width: 500, height: 50 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 28,
        fontWeight: 400,
        letterSpacing: 2,
        color: '#6b7280',
      }),
      createText('jiho@studio.kr   ·   010-1234-5678', { x: 90, y: 430, width: 700, height: 44 }, {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 500,
        color: '#111827',
      }),
      createIcon('다이아', iconPath('diamond'), { x: 860, y: 90, width: 96, height: 96 }, { color: '#6d5efc' }),
    ]),
    page('뒷면', { kind: 'solid', color: '#111827' }, [
      createText('STUDIO\nLAB', { x: 90, y: 200, width: 500, height: 220 }, {
        fontFamily: 'Montserrat',
        fontSize: 86,
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: 2,
        color: '#ffffff',
      }),
      createShape('line', { x: 600, y: 300, width: 360, height: 3 }, {
        stroke: { color: '#6d5efc', width: 3, dash: 0 },
      }),
    ]),
  ]);

const storyPromo = (): Design =>
  design('스토리 홍보', 1080, 1920, ['#10231c', '#3f9a6a', '#9fd8b4', '#f1faf4', '#ffffff'], [
    page('스토리', { kind: 'gradient', from: '#10231c', to: '#1f4c3a', angle: 160 }, [
      createShape('rectangle', { x: 80, y: 420, width: 920, height: 1080 }, {
        fill: { kind: 'solid', color: '#f1faf4' },
        radius: 48,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.35)', blur: 60, offsetX: 0, offsetY: 24 },
      }),
      createText('NEW DROP', { x: 140, y: 240, width: 500, height: 50 }, {
        fontFamily: 'Inter',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 10,
        color: '#9fd8b4',
        uppercase: true,
      }),
      createText('가을 신상\n컬렉션', { x: 140, y: 500, width: 760, height: 320 }, {
        fontFamily: 'Montserrat',
        fontSize: 118,
        fontWeight: 800,
        lineHeight: 1.02,
        letterSpacing: -3,
        color: '#10231c',
      }),
      createText('천연 소재로 만든 10가지 아이템.\n오늘 오후 8시 오픈.', { x: 140, y: 860, width: 760, height: 200 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 38,
        fontWeight: 400,
        lineHeight: 1.6,
        color: '#2f5c48',
      }),
      createShape('rectangle', { x: 140, y: 1120, width: 420, height: 110 }, {
        fill: { kind: 'solid', color: '#3f9a6a' },
        radius: 55,
      }),
      createText('둘러보기', { x: 140, y: 1152, width: 420, height: 52 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 38,
        fontWeight: 700,
        align: 'center',
        color: '#ffffff',
      }),
      createIcon('잎', iconPath('leaf'), { x: 760, y: 1240, width: 160, height: 160 }, { color: '#9fd8b4' }),
      createText('@studio.lab', { x: 140, y: 1700, width: 500, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 600,
        letterSpacing: 2,
        color: '#9fd8b4',
      }),
    ]),
  ]);

const webinarBanner = (): Design =>
  design('웨비나 배너', 1600, 500, ['#2b1331', '#e2456b', '#ff9f68', '#fff3e2', '#ffffff'], [
    page('배너', { kind: 'gradient', from: '#2b1331', to: '#7a1f4f', angle: 110 }, [
      createShape('ellipse', { x: 1240, y: -120, width: 460, height: 460 }, {
        fill: { kind: 'gradient', from: '#e2456b', to: '#ff9f68', angle: 140 },
        opacity: 0.85,
      }),
      createText('무료 웨비나', { x: 80, y: 110, width: 420, height: 50 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: 6,
        color: '#ff9f68',
      }),
      createText('디자인 시스템을 처음 만드는 팀을 위한 안내', { x: 80, y: 180, width: 1000, height: 160 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 56,
        fontWeight: 700,
        lineHeight: 1.25,
        color: '#ffffff',
      }),
      createText('3월 21일 목요일 저녁 8시 · 온라인', { x: 80, y: 370, width: 800, height: 50 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 400,
        color: '#ffd9c2',
      }),
    ]),
  ]);

const menu = (): Design =>
  design('카페 메뉴', 2480, 3508, ['#1b1b1f', '#8a8a93', '#d4d4d8', '#fafafa', '#ffffff'], [
    page('메뉴', { kind: 'solid', color: '#fdfaf4' }, [
      createText('MORNING\nCAFE', { x: 240, y: 260, width: 1600, height: 520 }, {
        fontFamily: 'Playfair Display',
        fontSize: 220,
        fontWeight: 900,
        lineHeight: 1.02,
        color: '#1b1b1f',
      }),
      createShape('line', { x: 240, y: 840, width: 2000, height: 4 }, {
        stroke: { color: '#1b1b1f', width: 4, dash: 0 },
      }),
      createText('COFFEE', { x: 240, y: 940, width: 900, height: 90 }, {
        fontFamily: 'Inter',
        fontSize: 56,
        fontWeight: 700,
        letterSpacing: 12,
        color: '#8a7a5c',
      }),
      createText(
        '에스프레소\n아메리카노\n플랫 화이트\n카페 라떼\n콜드브루',
        { x: 240, y: 1070, width: 1300, height: 700 },
        { fontFamily: 'Gowun Batang', fontSize: 72, fontWeight: 400, lineHeight: 1.9, color: '#1b1b1f' },
      ),
      createText('4,000\n4,500\n5,200\n5,000\n5,800', { x: 1900, y: 1070, width: 340, height: 700 }, {
        fontFamily: 'Space Mono',
        fontSize: 64,
        fontWeight: 400,
        lineHeight: 2.14,
        align: 'right',
        color: '#1b1b1f',
      }),
      createText('DESSERT', { x: 240, y: 1900, width: 900, height: 90 }, {
        fontFamily: 'Inter',
        fontSize: 56,
        fontWeight: 700,
        letterSpacing: 12,
        color: '#8a7a5c',
      }),
      createText('버터 크루아상\n바스크 치즈케이크\n레몬 파운드', { x: 240, y: 2030, width: 1300, height: 440 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 72,
        fontWeight: 400,
        lineHeight: 1.9,
        color: '#1b1b1f',
      }),
      createText('4,800\n6,500\n5,200', { x: 1900, y: 2030, width: 340, height: 440 }, {
        fontFamily: 'Space Mono',
        fontSize: 64,
        fontWeight: 400,
        lineHeight: 2.14,
        align: 'right',
        color: '#1b1b1f',
      }),
      createIcon('물방울', iconPath('droplet'), { x: 2060, y: 3140, width: 180, height: 180 }, { color: '#d8cdb4' }),
    ]),
  ]);

const photoCollage = (): Design =>
  design('사진 모눈 레이아웃', 1080, 1350, ['#111827', '#6366f1', '#f4f4f5', '#ffffff', '#27272a'], [
    page('레이아웃', { kind: 'solid', color: '#ffffff' }, [
      createShape('rectangle', { x: 60, y: 60, width: 960, height: 520 }, {
        fill: { kind: 'gradient', from: '#6366f1', to: '#a5b4fc', angle: 140 },
        radius: 24,
      }),
      createShape('rectangle', { x: 60, y: 610, width: 460, height: 380 }, {
        fill: { kind: 'gradient', from: '#f472b6', to: '#fbcfe8', angle: 120 },
        radius: 24,
      }),
      createShape('rectangle', { x: 560, y: 610, width: 460, height: 380 }, {
        fill: { kind: 'gradient', from: '#22d3ee', to: '#bae6fd', angle: 120 },
        radius: 24,
      }),
      createText('사진을 여기로 드래그하세요', { x: 60, y: 1030, width: 960, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 700,
        align: 'center',
        color: '#111827',
      }),
      createText('왼쪽 “업로드” 패널에서 이미지를 올리면 도형 위에 배치됩니다.', {
        x: 60,
        y: 1110,
        width: 960,
        height: 100,
      }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 26,
        fontWeight: 400,
        align: 'center',
        lineHeight: 1.6,
        color: '#6b7280',
      }),
    ]),
  ]);

export const TEMPLATES: readonly TemplateDefinition[] = [
  { id: 'bold-sale', label: '세일 포스트', category: '소셜', build: boldSale },
  { id: 'minimal-quote', label: '인용 카드', category: '소셜', build: minimalQuote },
  { id: 'story-promo', label: '스토리 홍보', category: '소셜', build: storyPromo },
  { id: 'yt-thumbnail', label: '유튜브 썸네일', category: '마케팅', build: thumbnail },
  { id: 'webinar-banner', label: '웨비나 배너', category: '마케팅', build: webinarBanner },
  { id: 'deck', label: '프레젠테이션 6장', category: '프레젠테이션', build: deck },
  { id: 'editorial-deck', label: '에디토리얼 덱 6장', category: '프레젠테이션', build: editorialDeck },
  { id: 'event-poster', label: '이벤트 포스터', category: '인쇄', build: eventPoster },
  { id: 'business-card', label: '명함', category: '인쇄', build: businessCard },
  { id: 'cafe-menu', label: '카페 메뉴', category: '인쇄', build: menu },
  { id: 'photo-collage', label: '사진 레이아웃', category: '소셜', build: photoCollage },
];

export const findTemplate = (id: string): TemplateDefinition | null =>
  TEMPLATES.find((template) => template.id === id) ?? null;
