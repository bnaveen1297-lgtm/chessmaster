/**
 * ChessMaster design tokens — light / classic look, inspired by the
 * Empower Chess portfolio: white surfaces, black actions, gold accents,
 * and bold colorful feature cards.
 */

export const colors = {
  // brand
  ink: '#1C1C1E', // primary label (near-black)
  tint: '#5B4BE0', // the single interactive accent (violet — matches the logo)
  gold: '#C9A24B', // reserved highlight (logo, XP, achievements)
  goldSoft: '#E7D3A1',

  // surfaces (iOS grouped look: gray ground, white cards)
  bg: '#F2F2F7', // systemGroupedBackground
  bgAlt: '#EDEDF2',
  surface: '#FFFFFF', // secondarySystemGroupedBackground
  border: 'rgba(60,60,67,0.13)', // separator hairline
  fill: 'rgba(120,120,128,0.12)', // secondarySystemFill (tracks, chips)

  // text (iOS label grays)
  text: '#1C1C1E',
  textMuted: '#6C6C70',
  textFaint: '#AEAEB2',
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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

/** iOS-style soft card elevation (subtle — grouped cards barely lift). */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

// iOS type ramp (SF): large title → caption.
export const typography = {
  display: { fontSize: 34, fontWeight: '800' as const, color: colors.text, letterSpacing: 0.35 },
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: 0.3 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text, letterSpacing: 0.2 },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
  muted: { fontSize: 13.5, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textFaint, letterSpacing: 0.4 },
} as const;
