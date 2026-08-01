/**
 * iOS 风格设计令牌：留白充裕、分组卡片、柔和灰阶
 */
export const Brand = {
  black: '#1C1C1E',
  white: '#FFFFFF',
  /** 系统分组背景 */
  canvas: '#F2F2F7',
  gray50: '#F9F9FB',
  gray100: '#F2F2F7',
  gray200: '#E5E5EA',
  gray300: '#D1D1D6',
  gray400: '#8E8E93',
  gray600: '#636366',
  gray800: '#3A3A3C',
  overlay: 'rgba(28, 28, 30, 0.42)',
  shadow: '#000000',
  hairline: 'rgba(60, 60, 67, 0.12)',
} as const;

/** 页面水平内边距（避免贴边） */
export const Page = {
  inset: 20,
  insetWide: 24,
  bottomExtra: 12,
  sectionGap: 20,
} as const;

export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const Type = {
  largeTitle: 34,
  title: 28,
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption: 12,
} as const;
