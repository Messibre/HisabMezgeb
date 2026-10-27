/**
 * Design system tokens for Hisab Mezgeb.
 * Single source of truth for all color and layout tokens.
 */

export interface ThemeTokens {
  // Brand & Semantic
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  primaryForeground: string;

  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  secondaryForeground: string;

  // Money semantic tokens
  moneyIn: string;
  moneyInStrong: string;
  moneyOut: string;
  moneyOutStrong: string;
  moneyNeutral: string;
  moneyNeutralStrong: string;

  // Navigation tokens
  navActiveBg: string;
  navActiveFg: string;
  navInactive: string;

  // Danger / Destructive
  danger: string;
  dangerContainer: string;
  onDangerContainer: string;
  destructive: string;
  destructiveForeground: string;

  // Surfaces & Background
  background: string;
  foreground: string;
  surface: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Text & Outlines
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  outlineStrong: string;

  // shadcn base mappings
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
}

export const lightTokens: ThemeTokens = {
  primary: '#2e5a27',
  primaryHover: '#24471f',
  primaryActive: '#1a3517',
  primaryContainer: '#d2e8cc',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#0b1f07',
  primaryForeground: '#ffffff',

  secondary: '#52dc90',
  secondaryContainer: '#a3f7bf',
  onSecondaryContainer: '#00210c',
  secondaryForeground: '#00210c',

  moneyIn: '#1b8a44',
  moneyInStrong: '#146934',
  moneyOut: '#c8441b',
  moneyOutStrong: '#9e3210',
  moneyNeutral: '#b46d23',
  moneyNeutralStrong: '#8a5014',

  navActiveBg: '#a3f7bf',
  navActiveFg: '#00210c',
  navInactive: '#717973',

  danger: '#ba1a1a',
  dangerContainer: '#ffdad6',
  onDangerContainer: '#410002',
  destructive: '#ba1a1a',
  destructiveForeground: '#ffffff',

  background: '#f9f9f8',
  foreground: '#191c19',
  surface: '#f9f9f8',
  card: '#ffffff',
  cardForeground: '#191c19',
  popover: '#ffffff',
  popoverForeground: '#191c19',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f3f4f3',
  surfaceContainer: '#eceeec',
  surfaceContainerHigh: '#e6e8e6',
  surfaceContainerHighest: '#e0e2e0',

  onSurface: '#191c19',
  onSurfaceVariant: '#404943',
  outline: '#717973',
  outlineVariant: '#c0c9c2',
  outlineStrong: '#404943',

  muted: '#f3f4f3',
  mutedForeground: '#404943',
  accent: '#f3f4f3',
  accentForeground: '#191c19',
  border: '#c0c9c2',
  // Darker token for input borders to satisfy WCAG 3:1 non-text contrast requirement
  input: '#717973',
  ring: '#2e5a27',
};

export const darkTokens: ThemeTokens = {
  primary: '#9ed495',
  primaryHover: '#b4e4ab',
  primaryActive: '#cbf5c2',
  primaryContainer: '#1a3517',
  onPrimary: '#0b1f07',
  onPrimaryContainer: '#d2e8cc',
  primaryForeground: '#0b1f07',

  secondary: '#52dc90',
  secondaryContainer: '#003919',
  onSecondaryContainer: '#a3f7bf',
  secondaryForeground: '#00210c',

  moneyIn: '#52dc90',
  moneyInStrong: '#76e8a6',
  moneyOut: '#ff8c73',
  moneyOutStrong: '#ffab99',
  moneyNeutral: '#ffba73',
  moneyNeutralStrong: '#ffd199',

  navActiveBg: '#1a3517',
  navActiveFg: '#d2e8cc',
  navInactive: '#8a938c',

  danger: '#ffb4ab',
  dangerContainer: '#93000a',
  onDangerContainer: '#ffdad6',
  destructive: '#ffb4ab',
  destructiveForeground: '#410002',

  background: '#111411',
  foreground: '#e1e3e0',
  surface: '#111411',
  card: '#191c19',
  cardForeground: '#e1e3e0',
  popover: '#191c19',
  popoverForeground: '#e1e3e0',
  surfaceContainerLowest: '#0c0f0d',
  surfaceContainerLow: '#191c19',
  surfaceContainer: '#1d211d',
  surfaceContainerHigh: '#272b27',
  surfaceContainerHighest: '#323632',

  onSurface: '#e1e3e0',
  onSurfaceVariant: '#c0c9c2',
  outline: '#8a938c',
  outlineVariant: '#404943',
  outlineStrong: '#e1e3e0',

  muted: '#1d211d',
  mutedForeground: '#c0c9c2',
  accent: '#1d211d',
  accentForeground: '#e1e3e0',
  border: '#404943',
  // Dark mode input border token satisfying >= 3:1 contrast against dark card/surface
  input: '#8a938c',
  ring: '#9ed495',
};

export const tokens = {
  light: lightTokens,
  dark: darkTokens,
};

/**
 * WCAG 2.1 Color contrast helper functions
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function sRGBToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRGBToLinear(r) + 0.7152 * sRGBToLinear(g) + 0.0722 * sRGBToLinear(b);
}

export function contrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
