/** Print templates: A4 sheets, tickets and invitations. */

import { createIcon, createShape, createText } from '../elements.js';
import { design, iconPath, page, type TemplateDefinition } from '../templateBuilders.js';
import type { Design, DesignElement } from '../document.js';

/** A priced line on a tariff sheet. */
const priceLine = (y: number, name: string, note: string, price: string): readonly DesignElement[] => [
  createText(name, { x: 240, y, width: 1300, height: 90 }, {
    fontFamily: 'Noto Sans KR',
    fontSize: 64,
    fontWeight: 700,
    color: '#1b1b1f',
  }),
  createText(note, { x: 240, y: y + 90, width: 1300, height: 70 }, {
    fontFamily: 'Noto Sans KR',
    fontSize: 36,
    fontWeight: 400,
    color: '#8a8a93',
  }),
  createText(price, { x: 1700, y, width: 540, height: 90 }, {
    fontFamily: 'Space Mono',
    fontSize: 62,
    fontWeight: 700,
    align: 'right',
    color: '#1b1b1f',
  }),
];

/** An A4 flyer: one headline, the details, a way to respond. */
const flyer = (): Design =>
  design('A4 전단지', 2480, 3508, ['#0b1021', '#6d5efc', '#f472b6', '#f4f5ff', '#ffffff'], [
    page('전단지', { kind: 'solid', color: '#ffffff' }, [
      createShape('rectangle', { x: 0, y: 0, width: 2480, height: 1180 }, {
        fill: { kind: 'gradient', from: '#0b1021', to: '#6d5efc', angle: 150 },
        radius: 0,
      }),
      createText('봄맞이 클래스', { x: 200, y: 300, width: 1700, height: 90 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 58,
        fontWeight: 500,
        letterSpacing: 10,
        color: '#c7cdf2',
      }),
      createText('처음 만드는\n나만의 포스터', { x: 200, y: 430, width: 2000, height: 520 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 190,
        fontWeight: 700,
        lineHeight: 1.16,
        letterSpacing: -6,
        color: '#ffffff',
      }),
      createText(
        '디자인을 배운 적 없어도 괜찮습니다. 3시간이면 인쇄까지 끝나는 한 장을 직접 만들어 갑니다.',
        { x: 200, y: 1320, width: 1900, height: 260 },
        { fontFamily: 'Noto Sans KR', fontSize: 62, fontWeight: 400, lineHeight: 1.7, color: '#374151' },
      ),
      createShape('line', { x: 200, y: 1680, width: 2080, height: 5 }, {
        stroke: { color: '#e3e4ec', width: 4, dash: 0 },
      }),
      createText(
        '일시   3월 23일 토요일 오후 2시\n장소   성수 디자인 스테이션 2층\n정원   16명 (선착순)\n준비물  노트북',
        { x: 200, y: 1760, width: 2080, height: 700 },
        { fontFamily: 'Noto Sans KR', fontSize: 64, fontWeight: 400, lineHeight: 2.1, color: '#1f2a53' },
      ),
      createShape('rectangle', { x: 200, y: 2600, width: 1000, height: 200 }, {
        fill: { kind: 'solid', color: '#6d5efc' },
        radius: 100,
      }),
      createText('신청하기', { x: 200, y: 2662, width: 1000, height: 100 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 72,
        fontWeight: 700,
        align: 'center',
        color: '#ffffff',
      }),
      createText('studiolab.kr/class   ·   02-1234-5678', { x: 200, y: 2900, width: 2080, height: 90 }, {
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 500,
        color: '#6b7280',
      }),
      createIcon('다이아', iconPath('diamond'), { x: 2060, y: 3180, width: 180, height: 180 }, {
        color: '#e3e4ec',
      }),
    ]),
  ]);

/** A tear-off ticket, front and back. */
const ticket = (): Design =>
  design('티켓', 1050, 600, ['#2b1331', '#e2456b', '#ffd166', '#fff3e2', '#ffffff'], [
    page('앞면', { kind: 'solid', color: '#2b1331' }, [
      createShape('ellipse', { x: 740, y: -90, width: 400, height: 400 }, {
        fill: { kind: 'gradient', from: '#e2456b', to: '#ffd166', angle: 130 },
        opacity: 0.85,
      }),
      createText('ADMIT ONE', { x: 70, y: 90, width: 500, height: 50 }, {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: 10,
        color: '#ffd166',
      }),
      createText('봄밤 음악회', { x: 70, y: 170, width: 640, height: 130 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 82,
        fontWeight: 700,
        letterSpacing: -2,
        color: '#ffffff',
      }),
      createText('3월 29일 금요일 오후 7시 30분', { x: 70, y: 330, width: 640, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 400,
        color: '#ffd9c2',
      }),
      createShape('line', { x: 70, y: 430, width: 500, height: 3 }, {
        stroke: { color: '#7a1f4f', width: 3, dash: 14 },
      }),
      createText('NO. 0142', { x: 70, y: 470, width: 400, height: 60 }, {
        fontFamily: 'Space Mono',
        fontSize: 34,
        fontWeight: 700,
        color: '#e2456b',
      }),
    ]),
    page('뒷면', { kind: 'solid', color: '#fff3e2' }, [
      createText(
        '· 공연 시작 후에는 입장이 제한됩니다.\n· 티켓 분실 시 재발행되지 않습니다.\n· 사진 촬영은 삼가 주세요.',
        { x: 70, y: 180, width: 910, height: 260 },
        { fontFamily: 'Noto Sans KR', fontSize: 32, fontWeight: 400, lineHeight: 1.9, color: '#7a6a63' },
      ),
      createText('성수 아트홀', { x: 70, y: 470, width: 600, height: 60 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 30,
        fontWeight: 700,
        color: '#2b1331',
      }),
    ]),
  ]);

/** An A4 price list. */
const priceList = (): Design =>
  design('가격표 A4', 2480, 3508, ['#1b1b1f', '#8a7a5c', '#d8cdb4', '#fdfaf4', '#ffffff'], [
    page('가격표', { kind: 'solid', color: '#fdfaf4' }, [
      createText('PRICE', { x: 240, y: 280, width: 1200, height: 100 }, {
        fontFamily: 'Inter',
        fontSize: 54,
        fontWeight: 700,
        letterSpacing: 16,
        color: '#8a7a5c',
      }),
      createText('서비스 안내', { x: 240, y: 400, width: 1800, height: 220 }, {
        fontFamily: 'Playfair Display',
        fontSize: 180,
        fontWeight: 700,
        letterSpacing: -4,
        color: '#1b1b1f',
      }),
      createShape('line', { x: 240, y: 700, width: 2000, height: 5 }, {
        stroke: { color: '#1b1b1f', width: 4, dash: 0 },
      }),
      ...priceLine(820, '로고 디자인', '시안 3안 · 수정 2회', '800,000'),
      ...priceLine(1120, '명함 디자인', '앞뒤 양면 · 인쇄 파일 포함', '250,000'),
      ...priceLine(1420, '포스터 한 장', 'A4 또는 A3 · 인쇄 파일 포함', '320,000'),
      ...priceLine(1720, '브랜드 가이드', '색상 · 서체 · 사용 규칙', '1,400,000'),
      ...priceLine(2020, 'SNS 템플릿', '5종 세트 · 편집 가능', '480,000'),
      createShape('line', { x: 240, y: 2360, width: 2000, height: 3 }, {
        stroke: { color: '#d8cdb4', width: 2, dash: 0 },
      }),
      createText(
        '· 표시 가격은 부가세 별도입니다.\n· 작업 범위에 따라 조정될 수 있습니다.\n· 문의  hello@studiolab.kr',
        { x: 240, y: 2440, width: 2000, height: 400 },
        { fontFamily: 'Noto Sans KR', fontSize: 44, fontWeight: 400, lineHeight: 1.95, color: '#6b6b73' },
      ),
    ]),
  ]);

/** A portrait invitation. */
const invitation = (): Design =>
  design('초대장', 1587, 2245, ['#10231c', '#3f9a6a', '#9fd8b4', '#f1faf4', '#ffffff'], [
    page('초대장', { kind: 'solid', color: '#f1faf4' }, [
      createShape('rectangle', { x: 90, y: 90, width: 1407, height: 2065 }, {
        fill: { kind: 'none' },
        stroke: { color: '#3f9a6a', width: 4, dash: 0 },
        radius: 0,
      }),
      createIcon('잎', iconPath('leaf'), { x: 713, y: 230, width: 160, height: 160 }, {
        color: '#9fd8b4',
      }),
      createText('초대합니다', { x: 240, y: 470, width: 1107, height: 90 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 44,
        fontWeight: 400,
        letterSpacing: 14,
        align: 'center',
        color: '#3f9a6a',
      }),
      createText('스튜디오랩\n오픈 하우스', { x: 200, y: 620, width: 1187, height: 420 }, {
        fontFamily: 'Gowun Batang',
        fontSize: 150,
        fontWeight: 700,
        lineHeight: 1.2,
        align: 'center',
        color: '#10231c',
      }),
      createShape('line', { x: 643, y: 1120, width: 300, height: 3 }, {
        stroke: { color: '#3f9a6a', width: 3, dash: 0 },
      }),
      createText(
        '2026년 4월 12일 토요일\n오후 5시\n\n서울 성동구 연무장길 45\n스튜디오랩 2층',
        { x: 240, y: 1200, width: 1107, height: 560 },
        {
          fontFamily: 'Noto Sans KR',
          fontSize: 48,
          fontWeight: 400,
          align: 'center',
          lineHeight: 1.9,
          color: '#2f5c48',
        },
      ),
      createText('참석 여부를 4월 5일까지 알려주세요', { x: 240, y: 1900, width: 1107, height: 70 }, {
        fontFamily: 'Noto Sans KR',
        fontSize: 34,
        fontWeight: 400,
        align: 'center',
        color: '#6b8f7d',
      }),
    ]),
  ]);

export const PRINT_TEMPLATES: readonly TemplateDefinition[] = [
  { id: 'flyer-a4', label: 'A4 전단지', category: '인쇄', build: flyer },
  { id: 'ticket', label: '티켓', category: '인쇄', build: ticket },
  { id: 'price-list', label: '가격표 A4', category: '인쇄', build: priceList },
  { id: 'invitation', label: '초대장', category: '인쇄', build: invitation },
];
