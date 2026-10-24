/** A small built-in icon set. Solid single-path glyphs on a 24-unit grid. */

export interface IconDefinition {
  readonly id: string;
  readonly label: string;
  readonly pathData: string;
}

export const ICONS: readonly IconDefinition[] = [
  { id: 'heart', label: '하트', pathData: 'M12 21.2S3.4 16 2.3 10.7A5.6 5.6 0 0 1 12 6.6a5.6 5.6 0 0 1 9.7 4.1C20.6 16 12 21.2 12 21.2z' },
  { id: 'star', label: '별', pathData: 'M12 2.4l3 6.2 6.8.9-5 4.8 1.2 6.8L12 17.9l-6 3.2 1.2-6.8-5-4.8 6.8-.9z' },
  { id: 'check', label: '체크', pathData: 'M4 12.6l5.1 5.2L20.2 6.4l-2.2-2.2-8.9 9.1-2.9-3z' },
  { id: 'bolt', label: '번개', pathData: 'M13.4 1.8L4 14h6l-1.4 8.2L20 9.6h-6.6z' },
  { id: 'bell', label: '알림', pathData: 'M12 2.6A5.4 5.4 0 0 0 6.6 8v4.2L4.4 15.8h15.2L17.4 12.2V8A5.4 5.4 0 0 0 12 2.6zM9.3 17.4a2.7 2.7 0 0 0 5.4 0z' },
  { id: 'cloud', label: '구름', pathData: 'M6.6 19.4a4.8 4.8 0 0 1-.6-9.5A6.3 6.3 0 0 1 18 9.2a4.5 4.5 0 0 1 .1 10.2z' },
  { id: 'camera', label: '카메라', pathData: 'M3.4 6.8h3.4L8.3 4.6h7.4l1.5 2.2h3.4v12.6H3.4zm8.6 2.6a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8z' },
  { id: 'pin', label: '위치', pathData: 'M12 1.8a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 13.2 7.2 13.2s7.2-7.8 7.2-13.2A7.2 7.2 0 0 0 12 1.8zm0 9.7A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z' },
  { id: 'play', label: '재생', pathData: 'M7.6 4.2L19.4 12 7.6 19.8z' },
  { id: 'plus', label: '더하기', pathData: 'M10.5 2.8h3v7.7h7.7v3h-7.7v7.7h-3v-7.7H2.8v-3h7.7z' },
  { id: 'circle', label: '원', pathData: 'M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4z' },
  { id: 'square', label: '사각형', pathData: 'M2.8 2.8h18.4v18.4H2.8z' },
  { id: 'triangle', label: '삼각형', pathData: 'M12 2.6l9.6 18.2H2.4z' },
  { id: 'chat', label: '대화', pathData: 'M3.2 3.6h17.6v11.8H9.6L3.2 20.8z' },
  { id: 'sun', label: '태양', pathData: 'M12 6.6A5.4 5.4 0 1 0 12 17.4 5.4 5.4 0 0 0 12 6.6zM11 1h2v3.3h-2zm0 19.7h2V24h-2zM1 11h3.3v2H1zm19.7 0H24v2h-3.3zM3.9 5.3l1.4-1.4 2.4 2.4-1.5 1.4zm11.9 11.9l1.4-1.4 2.4 2.3-1.4 1.5zm1.4-9.1l-1.4-1.4 2.3-2.4 1.5 1.4zM6.2 19.8l-1.4-1.5 2.3-2.3 1.5 1.4z' },
  { id: 'moon', label: '달', pathData: 'M14.6 2.4a9.8 9.8 0 1 0 7 15.8A10.4 10.4 0 0 1 14.6 2.4z' },
  { id: 'leaf', label: '잎', pathData: 'M20.8 3.2C10.2 3.2 3.8 8.6 3.8 16c0 1.7.4 3.2 1.1 4.5C7.5 13.2 12.6 9.4 20.8 9c-7.4 2.2-11.6 6.4-13.4 12.2h2.9c8.5-1.1 10.5-9.6 10.5-18z' },
  { id: 'flag', label: '깃발', pathData: 'M5.4 2.6h2.2v19H5.4zm2.6 1h11.6l-2.7 4.3 2.7 4.3H8z' },
  { id: 'diamond', label: '다이아', pathData: 'M12 1.8l6.4 6.4L12 22.2 5.6 8.2z' },
  { id: 'arrow-right', label: '오른쪽 화살표', pathData: 'M3.4 10.3h10.2V5.4L20.6 12l-7 6.6v-4.9H3.4z' },
  { id: 'arrow-up', label: '위쪽 화살표', pathData: 'M10.3 20.6V10.4H5.4L12 3.4l6.6 7h-4.9v10.2z' },
  { id: 'crown', label: '왕관', pathData: 'M2.6 7.4l4.4 3.3L12 3.2l5 7.5 4.4-3.3-2.2 12.6H4.8z' },
  { id: 'shield', label: '방패', pathData: 'M12 1.8l8.4 3.1v6.8c0 5.2-3.6 9.4-8.4 11-4.8-1.6-8.4-5.8-8.4-11V4.9z' },
  { id: 'droplet', label: '물방울', pathData: 'M12 2.2c4.2 5.2 7.3 8.3 7.3 11.8A7.3 7.3 0 0 1 4.7 14c0-3.5 3.1-6.6 7.3-11.8z' },
  { id: 'note', label: '음표', pathData: 'M16.2 2.6v10.8a3.5 3.5 0 1 0 2 3.2V7h3.2V2.6z' },
];

export const findIcon = (id: string): IconDefinition | null =>
  ICONS.find((icon) => icon.id === id) ?? null;
