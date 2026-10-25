/** Social templates: square posts, stories and portrait feeds. */

import { createIcon, createShape, createText } from '../elements.js';
import { design, iconPath, page, type TemplateDefinition } from '../templateBuilders.js';
import type { Design } from '../document.js';

const INK = ['#0b1021', '#6d5efc', '#f472b6', '#facc15', '#ffffff'];

/** A carousel's first card: one big number and the promise. */
const carouselCover = (): Design =>
  design('캐러셀 표지', 1080, 1080, INK, [
    page('표지', { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 150 }, [
      createText('05', { x: 90, y: 110, width: 300, height: 220 }, {
        fontFamily: 'Montserrat',
        fontSize: 190,
        fontWeight: 800,
        letterSpacing: -8,
        color: '#2f3b74',
      }),
      createText('디자인이\n바로 좋아지는\n다섯 가지', { x: 90, y: 330, width: 820, height: 420 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 96,
        fontWeight: 700,
        lineHeight: 1.22,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createShape('rectangle', { x: 90, y: 820, width: 180, height: 8 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#f472b6', angle: 90 },
        radius: 4,
      }),
      createText('넘겨서 보기 →', { x: 90, y: 880, width: 500, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 500,
        letterSpacing: 2,
        color: '#a5b4fc',
      }),
    ]),
  ]);

/** A carousel body card: a step, its heading and a short explanation. */
const carouselStep = (): Design =>
  design('캐러셀 내용', 1080, 1080, INK, [
    page('내용', { kind: 'solid', color: '#f4f5ff' }, [
      createShape('ellipse', { x: 90, y: 110, width: 96, height: 96 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
      }),
      createText('1', { x: 90, y: 134, width: 96, height: 60 }, {
        fontFamily: 'Montserrat',
        fontSize: 48,
        fontWeight: 800,
        align: 'center',
        color: '#ffffff',
      }),
      createText('여백을 먼저 정한다', { x: 90, y: 260, width: 860, height: 140 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 72,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#0b1021',
      }),
      createText(
        '요소를 채우기 전에 가장자리와 요소 사이의 간격을 먼저 정하세요. 간격이 일정하면 그 안에서 무엇을 넣어도 정돈돼 보입니다.',
        { x: 90, y: 430, width: 860, height: 300 },
        { fontFamily: 'Noto Sans KR', fontSize: 38, fontWeight: 400, lineHeight: 1.7, color: '#4b5168' },
      ),
      createShape('line', { x: 90, y: 900, width: 860, height: 3 }, {
        stroke: { color: '#c7cdf2', width: 2, dash: 0 },
      }),
      createText('1 / 5', { x: 90, y: 930, width: 860, height: 50 }, {
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: 600,
        align: 'right',
        color: '#8e92a4',
      }),
    ]),
  ]);

/** A vertical cover for short video. */
const reelCover = (): Design =>
  design('릴스 커버', 1080, 1920, ['#2b1331', '#e2456b', '#ff9f68', '#ffe3b0', '#ffffff'], [
    page('커버', { kind: 'gradient', from: '#2b1331', to: '#7a1f4f', angle: 160 }, [
      createShape('ellipse', { x: 620, y: 1380, width: 620, height: 620 }, {
        fill: { kind: 'gradient', from: '#e2456b', to: '#ff9f68', angle: 120 },
        opacity: 0.75,
      }),
      createText('3분 만에', { x: 110, y: 620, width: 860, height: 120 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 72,
        fontWeight: 500,
        color: '#ff9f68',
      }),
      createText('포스터\n한 장', { x: 110, y: 760, width: 900, height: 480 }, {
        fontFamily: 'Montserrat',
        fontSize: 200,
        fontWeight: 800,
        lineHeight: 1.02,
        letterSpacing: -8,
        color: '#ffffff',
      }),
      createIcon('재생', iconPath('play'), { x: 110, y: 1320, width: 110, height: 110 }, {
        color: '#ffe3b0',
      }),
    ]),
  ]);

/** A person, for an introduction or a speaker announcement. */
const profileCard = (): Design =>
  design('프로필 카드', 1080, 1080, ['#10231c', '#3f9a6a', '#9fd8b4', '#f1faf4', '#ffffff'], [
    page('프로필', { kind: 'solid', color: '#f1faf4' }, [
      createShape('ellipse', { x: 390, y: 120, width: 300, height: 300 }, {
        fill: { kind: 'gradient', from: '#3f9a6a', to: '#9fd8b4', angle: 140 },
      }),
      createText('사진을 여기에', { x: 390, y: 250, width: 300, height: 50 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 26,
        fontWeight: 500,
        align: 'center',
        color: '#ffffff',
      }),
      createText('김하늘', { x: 90, y: 480, width: 900, height: 120 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 88,
        fontWeight: 700,
        align: 'center',
        letterSpacing: -2,
        color: '#10231c',
      }),
      createText('브랜드 디렉터 · 스튜디오랩', { x: 90, y: 610, width: 900, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 400,
        align: 'center',
        color: '#2f5c48',
      }),
      createShape('line', { x: 390, y: 720, width: 300, height: 3 }, {
        stroke: { color: '#9fd8b4', width: 3, dash: 0 },
      }),
      createText(
        '“브랜드는 로고가 아니라 반복되는 인상입니다.”',
        { x: 140, y: 780, width: 800, height: 160 },
        {
          fontFamily: 'Gowun Batang',
          fontSize: 40,
          fontWeight: 400,
          align: 'center',
          lineHeight: 1.6,
          color: '#2f5c48',
        },
      ),
    ]),
  ]);

/** An announcement built around a date block. */
const eventNotice = (): Design =>
  design('이벤트 공지', 1080, 1080, ['#06212e', '#13a3b5', '#8be0e6', '#ffd166', '#ffffff'], [
    page('공지', { kind: 'solid', color: '#06212e' }, [
      createShape('rectangle', { x: 90, y: 110, width: 280, height: 280 }, {
        fill: { kind: 'solid', color: '#ffd166' },
        radius: 24,
      }),
      createText('03', { x: 90, y: 150, width: 280, height: 120 }, {
        fontFamily: 'Montserrat',
        fontSize: 110,
        fontWeight: 800,
        align: 'center',
        color: '#06212e',
      }),
      createText('MARCH', { x: 90, y: 290, width: 280, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: 6,
        align: 'center',
        color: '#06212e',
      }),
      createText('봄맞이\n워크숍', { x: 430, y: 120, width: 560, height: 280 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 92,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createText(
        '시간  오후 2시 — 5시\n장소  성수 디자인 스테이션\n정원  20명',
        { x: 90, y: 500, width: 900, height: 280 },
        { fontFamily: 'Noto Sans KR', fontSize: 40, fontWeight: 400, lineHeight: 1.9, color: '#8be0e6' },
      ),
      createShape('rectangle', { x: 90, y: 840, width: 420, height: 110 }, {
        fill: { kind: 'solid', color: '#13a3b5' },
        radius: 55,
      }),
      createText('신청하기', { x: 90, y: 873, width: 420, height: 56 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 40,
        fontWeight: 700,
        align: 'center',
        color: '#ffffff',
      }),
    ]),
  ]);

/** A customer's words, with a rating. */
const reviewCard = (): Design =>
  design('후기 카드', 1080, 1080, ['#1b1b1f', '#facc15', '#d4d4d8', '#fafaf7', '#ffffff'], [
    page('후기', { kind: 'solid', color: '#fafaf7' }, [
      createIcon('별', iconPath('star'), { x: 90, y: 130, width: 64, height: 64 }, { color: '#facc15' }),
      createIcon('별', iconPath('star'), { x: 170, y: 130, width: 64, height: 64 }, { color: '#facc15' }),
      createIcon('별', iconPath('star'), { x: 250, y: 130, width: 64, height: 64 }, { color: '#facc15' }),
      createIcon('별', iconPath('star'), { x: 330, y: 130, width: 64, height: 64 }, { color: '#facc15' }),
      createIcon('별', iconPath('star'), { x: 410, y: 130, width: 64, height: 64 }, { color: '#facc15' }),
      createText(
        '“처음 써보는데도 30분 만에 쓸 만한 포스터가 나왔어요. 다음 날 바로 인쇄까지 맡겼습니다.”',
        { x: 90, y: 270, width: 880, height: 420 },
        {
          fontFamily: 'Gowun Batang',
          fontSize: 62,
          fontWeight: 400,
          lineHeight: 1.55,
          color: '#1b1b1f',
        },
      ),
      createShape('line', { x: 90, y: 760, width: 140, height: 3 }, {
        stroke: { color: '#1b1b1f', width: 3, dash: 0 },
      }),
      createText('박서진 · 카페 운영', { x: 90, y: 800, width: 700, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 32,
        fontWeight: 500,
        color: '#6b6b73',
      }),
    ]),
  ]);

/** Two states beside each other. */
const beforeAfter = (): Design =>
  design('비포 애프터', 1080, 1080, ['#111827', '#6d5efc', '#22c55e', '#f4f4f5', '#ffffff'], [
    page('비교', { kind: 'solid', color: '#ffffff' }, [
      createShape('rectangle', { x: 60, y: 200, width: 460, height: 620 }, {
        fill: { kind: 'solid', color: '#e5e7eb' },
        radius: 20,
      }),
      createText('BEFORE', { x: 60, y: 120, width: 460, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: 6,
        align: 'center',
        color: '#8e92a4',
      }),
      createShape('rectangle', { x: 560, y: 200, width: 460, height: 620 }, {
        fill: { kind: 'gradient', from: '#6d5efc', to: '#a5b4fc', angle: 140 },
        radius: 20,
      }),
      createText('AFTER', { x: 560, y: 120, width: 460, height: 60 }, {
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: 6,
        align: 'center',
        color: '#6d5efc',
      }),
      createText('같은 사진, 다른 정리', { x: 60, y: 870, width: 960, height: 90 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 52,
        fontWeight: 700,
        align: 'center',
        letterSpacing: -1,
        color: '#111827',
      }),
    ]),
  ]);

export const SOCIAL_TEMPLATES: readonly TemplateDefinition[] = [
  { id: 'carousel-cover', label: '캐러셀 표지', category: '소셜', build: carouselCover },
  { id: 'carousel-step', label: '캐러셀 내용', category: '소셜', build: carouselStep },
  { id: 'reel-cover', label: '릴스 커버', category: '소셜', build: reelCover },
  { id: 'profile-card', label: '프로필 카드', category: '소셜', build: profileCard },
  { id: 'event-notice', label: '이벤트 공지', category: '소셜', build: eventNotice },
  { id: 'review-card', label: '후기 카드', category: '소셜', build: reviewCard },
  { id: 'before-after', label: '비포 애프터', category: '소셜', build: beforeAfter },
];
