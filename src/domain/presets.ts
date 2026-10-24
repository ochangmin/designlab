/** Document sizes, type choices and colour sets offered in the UI. */

import type { Paint } from './document.js';

export interface SizePreset {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly width: number;
  readonly height: number;
  readonly group: '소셜' | '문서' | '인쇄' | '영상';
}

export const SIZE_PRESETS: readonly SizePreset[] = [
  { id: 'ig-post', label: 'Instagram 포스트', hint: '1080 × 1080', width: 1080, height: 1080, group: '소셜' },
  { id: 'ig-story', label: 'Instagram 스토리', hint: '1080 × 1920', width: 1080, height: 1920, group: '소셜' },
  { id: 'fb-post', label: 'Facebook 포스트', hint: '1200 × 630', width: 1200, height: 630, group: '소셜' },
  { id: 'yt-thumb', label: 'YouTube 썸네일', hint: '1280 × 720', width: 1280, height: 720, group: '영상' },
  { id: 'slide-16-9', label: '프레젠테이션 16:9', hint: '1920 × 1080', width: 1920, height: 1080, group: '문서' },
  { id: 'a4-portrait', label: 'A4 세로', hint: '2480 × 3508', width: 2480, height: 3508, group: '인쇄' },
  { id: 'a4-landscape', label: 'A4 가로', hint: '3508 × 2480', width: 3508, height: 2480, group: '인쇄' },
  { id: 'poster', label: '포스터', hint: '1587 × 2245', width: 1587, height: 2245, group: '인쇄' },
  { id: 'card', label: '명함', hint: '1050 × 600', width: 1050, height: 600, group: '인쇄' },
  { id: 'banner', label: '웹 배너', hint: '1600 × 500', width: 1600, height: 500, group: '소셜' },
];

export interface FontChoice {
  readonly family: string;
  readonly label: string;
  readonly weights: readonly number[];
  readonly supportsKorean: boolean;
}

export const FONTS: readonly FontChoice[] = [
  { family: 'Inter', label: 'Inter', weights: [300, 400, 500, 600, 700, 800, 900], supportsKorean: false },
  { family: 'Montserrat', label: 'Montserrat', weights: [300, 400, 600, 800], supportsKorean: false },
  { family: 'Playfair Display', label: 'Playfair Display', weights: [400, 700, 900], supportsKorean: false },
  { family: 'Poppins', label: 'Poppins', weights: [300, 400, 600, 800], supportsKorean: false },
  { family: 'Lora', label: 'Lora', weights: [400, 700], supportsKorean: false },
  { family: 'Bebas Neue', label: 'Bebas Neue', weights: [400], supportsKorean: false },
  { family: 'Space Mono', label: 'Space Mono', weights: [400, 700], supportsKorean: false },
  { family: 'Noto Sans KR', label: '노토 산스 KR', weights: [300, 400, 500, 700, 900], supportsKorean: true },
  { family: 'Gowun Batang', label: '고운바탕', weights: [400, 700], supportsKorean: true },
  { family: 'Nanum Pen Script', label: '나눔손글씨 펜', weights: [400], supportsKorean: true },
];

export const weightsFor = (family: string): readonly number[] =>
  FONTS.find((font) => font.family === family)?.weights ?? [400, 700];

export interface PaletteChoice {
  readonly id: string;
  readonly label: string;
  readonly colors: readonly string[];
}

export const PALETTES: readonly PaletteChoice[] = [
  { id: 'indigo', label: '인디고 나이트', colors: ['#0b1021', '#1f2a53', '#6d5efc', '#a5b4fc', '#f4f5ff'] },
  { id: 'sunset', label: '선셋', colors: ['#2b1331', '#7a1f4f', '#e2456b', '#ff9f68', '#fff3e2'] },
  { id: 'forest', label: '포레스트', colors: ['#10231c', '#1f4c3a', '#3f9a6a', '#9fd8b4', '#f1faf4'] },
  { id: 'mono', label: '모노크롬', colors: ['#111111', '#3f3f46', '#8a8a93', '#d4d4d8', '#fafafa'] },
  { id: 'candy', label: '캔디', colors: ['#2d1b4e', '#6d3ad1', '#ff72c6', '#ffd166', '#fff7fb'] },
  { id: 'ocean', label: '오션', colors: ['#06212e', '#0b4f63', '#13a3b5', '#8be0e6', '#eefcfd'] },
];

export const GRADIENT_PRESETS: readonly Paint[] = [
  { kind: 'gradient', from: '#6d5efc', to: '#f472b6', angle: 135 },
  { kind: 'gradient', from: '#0ea5e9', to: '#22d3ee', angle: 160 },
  { kind: 'gradient', from: '#f97316', to: '#facc15', angle: 120 },
  { kind: 'gradient', from: '#10b981', to: '#a3e635', angle: 150 },
  { kind: 'gradient', from: '#111827', to: '#4b5563', angle: 180 },
  { kind: 'gradient', from: '#be185d', to: '#7c3aed', angle: 45 },
];

export const SWATCHES: readonly string[] = [
  '#ffffff',
  '#f4f4f5',
  '#d4d4d8',
  '#71717a',
  '#27272a',
  '#111827',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#6d5efc',
  '#a855f7',
  '#ec4899',
];

export interface TextStylePreset {
  readonly id: string;
  readonly label: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly letterSpacing: number;
  readonly lineHeight: number;
  readonly uppercase: boolean;
  readonly sample: string;
}

export const TEXT_STYLES: readonly TextStylePreset[] = [
  {
    id: 'display',
    label: '대제목',
    fontFamily: 'Montserrat',
    fontSize: 120,
    fontWeight: 800,
    letterSpacing: -2,
    lineHeight: 1.04,
    uppercase: false,
    sample: '제목을 입력하세요',
  },
  {
    id: 'heading',
    label: '제목',
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: 700,
    letterSpacing: -1,
    lineHeight: 1.12,
    uppercase: false,
    sample: '소제목',
  },
  {
    id: 'subheading',
    label: '부제목',
    fontFamily: 'Inter',
    fontSize: 42,
    fontWeight: 500,
    letterSpacing: 0,
    lineHeight: 1.25,
    uppercase: false,
    sample: '부제목을 입력하세요',
  },
  {
    id: 'body',
    label: '본문',
    fontFamily: 'Noto Sans KR',
    fontSize: 28,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.6,
    uppercase: false,
    sample: '본문 텍스트를 입력하세요. 여러 줄로 자동 줄바꿈됩니다.',
  },
  {
    id: 'eyebrow',
    label: '라벨',
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 6,
    lineHeight: 1.2,
    uppercase: true,
    sample: 'NEW ARRIVAL',
  },
  {
    id: 'quote',
    label: '인용',
    fontFamily: 'Playfair Display',
    fontSize: 56,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.3,
    uppercase: false,
    sample: '“좋은 디자인은 보이지 않는다.”',
  },
  {
    id: 'script',
    label: '손글씨',
    fontFamily: 'Nanum Pen Script',
    fontSize: 84,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.1,
    uppercase: false,
    sample: '감사합니다',
  },
];
