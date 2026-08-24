/**
 * ChessMaster design tokens — light / classic look, inspired by the
 * Empower Chess portfolio: white surfaces, black actions, gold accents,
 * and bold colorful feature cards.
 */

export const colors = {
  // brand
  ink: '#141414', // near-black (buttons, headings)
  gold: '#C9A24B', // accent (section numbers, highlights)
  goldSoft: '#E7D3A1',

  // surfaces (light-first)
  bg: '#FFFFFF',
  bgAlt: '#F5F5F6',
  surface: '#FFFFFF',
  border: '#E7E7EA',

  // text
  text: '#141414',
  textMuted: '#6B6B72',
  textFaint: '#9A9AA2',
  onDark: '#FFFFFF',

  // dark player surface (live game / puzzle board screens)
  dark: '#141414',
  darkAlt: '#1F1F22',

  // semantic
  success: '#2E9E6B',
  warning: '#D98A24',
  danger: '#D3524B',
  info: '#3B7BD1',

  // colorful feature cards (from the portfolio)
  teal: '#1F7A72',
  purple: '#8B3FA0',
  brown: '#7A4B3A',
  orange: '#EE7F3B',
  mint: '#3FCBA6',
  pink: '#EE7FA0',
  cyan: '#8AD6E4',
  lavender: '#B4A6C8',

  // board
  boardLight: '#EAD9B0',
  boardDark: '#9B7A4A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const, color: colors.text, letterSpacing: 0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  muted: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '700' as const, color: colors.textFaint, letterSpacing: 0.6 },
} as const;
