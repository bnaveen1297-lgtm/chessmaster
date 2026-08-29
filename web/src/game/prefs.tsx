import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const BOARD_THEMES = {
  wood: { name: 'Wood', light: '#EED9B6', dark: '#B58863' },
  green: { name: 'Green', light: '#EBECD0', dark: '#769656' },
  blue: { name: 'Ocean', light: '#DEE3E6', dark: '#6C93B5' },
  classic: { name: 'Classic', light: '#F0D9B5', dark: '#B58863' },
  slate: { name: 'Slate', light: '#EAEAEE', dark: '#8B92A0' },
  ice: { name: 'Ice', light: '#E7F1F7', dark: '#8FB4C8' },
} as const;

export type BoardThemeId = keyof typeof BOARD_THEMES;
export type PieceStyle = 'classic' | 'symbol';
export type Level = 'Beginner' | 'Intermediate' | 'Advanced';
export type Role = 'student' | 'improver' | 'competitor' | 'casual';

export type Prefs = {
  onboarded: boolean;
  role: Role | '';
  wantsCoach: boolean;
  level: Level;
  boardTheme: BoardThemeId;
  pieceStyle: PieceStyle;
};

const DEFAULT: Prefs = {
  onboarded: false,
  role: '',
  wantsCoach: false,
  level: 'Beginner',
  boardTheme: 'wood',
  pieceStyle: 'classic',
};

const KEY = 'chesshub360.prefs';

function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}

type Ctx = {
  prefs: Prefs;
  update: (p: Partial<Prefs>) => void;
  reset: () => void;
};
const PrefsContext = createContext<Ctx | undefined>(undefined);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      update: (p) => setPrefs((prev) => ({ ...prev, ...p })),
      reset: () => setPrefs(DEFAULT),
    }),
    [prefs],
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within PrefsProvider');
  return ctx;
}

/** Which curriculum unit indices (0-based) a level should see. */
export function levelUnitLimit(level: Level): number {
  return level === 'Beginner' ? 3 : level === 'Intermediate' ? 6 : 99;
}
/** Default puzzle band for a level. */
export function levelPuzzleBand(level: Level): 'Beginner' | 'Intermediate' | 'Advanced' {
  return level;
}
