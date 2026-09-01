import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { upsertProfile, fetchProfile } from '@/lib/profile';

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

// Preferences are cached per-user so multiple accounts on one browser never
// share state, and so a returning user keeps their setup even offline. The
// authoritative copy lives in Supabase (profiles.prefs) once available.
const BASE_KEY = 'chesshub360.prefs';
const keyFor = (userId?: string | null) => (userId ? `${BASE_KEY}.${userId}` : BASE_KEY);
const nameKeyFor = (userId?: string | null) => `${BASE_KEY}.name.${userId ?? 'guest'}`;

function readLocalName(userId?: string | null): string {
  try { return localStorage.getItem(nameKeyFor(userId)) || ''; } catch { return ''; }
}
function writeLocalName(userId: string | null | undefined, n: string) {
  try { localStorage.setItem(nameKeyFor(userId), n); } catch { /* ignore */ }
}

function readLocal(userId?: string | null): Prefs {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT;
}
function writeLocal(userId: string | null | undefined, p: Prefs) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

async function fetchRemote(userId: string): Promise<Prefs | null> {
  if (!(isSupabaseConfigured && supabase)) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    const remote = (data as any).prefs;
    // `prefs` column may be absent (migration 0009 not yet applied) → undefined.
    if (remote && typeof remote === 'object' && Object.keys(remote).length > 0) {
      return { ...DEFAULT, ...remote };
    }
    return null;
  } catch {
    return null;
  }
}

async function saveRemote(userId: string, p: Prefs): Promise<void> {
  // Errors are handled/retried inside upsertProfile (supabase-js returns errors
  // in the result, so the previous try/catch here silently dropped them).
  await upsertProfile(userId, { prefs: p as unknown as Record<string, unknown> });
}

type Ctx = {
  prefs: Prefs;
  /** True once prefs have been resolved for the current auth state. */
  loaded: boolean;
  update: (p: Partial<Prefs>) => void;
  reset: () => void;
  /** The user's display name (from the profile, backfilled from sign-in). */
  name: string;
  /** Persist a display name to the profile (shown on the leaderboard). */
  setName: (n: string) => void;
};
const PrefsContext = createContext<Ctx | undefined>(undefined);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(() => readLocal(null));
  const [prefsResolved, setPrefsResolved] = useState(false);
  const [nameResolved, setNameResolved] = useState(false);
  const [name, setNameState] = useState('');
  const userIdRef = useRef<string | null>(null);
  const metaName = user?.firstName?.trim() || '';
  // Onboarding is only gated once BOTH prefs and the display name have resolved,
  // so a returning user isn't briefly bounced into onboarding on load.
  const loaded = prefsResolved && nameResolved;

  // Resolve prefs whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    const uid = user?.id ?? null;
    userIdRef.current = uid;

    if (!uid) {
      setPrefs(readLocal(null));
      setNameState('');
      setPrefsResolved(true);
      setNameResolved(true);
      return;
    }

    const cached = readLocal(uid);
    setPrefs(cached);
    setNameState(readLocalName(uid)); // seed from cache so offline returns keep their name
    setPrefsResolved(false);
    setNameResolved(false);

    fetchRemote(uid).then((remote) => {
      if (cancelled || userIdRef.current !== uid) return;
      if (remote) {
        setPrefs(remote);
        writeLocal(uid, remote);
      } else if (cached.onboarded) {
        // Server has nothing yet but this device knows the user — push it up.
        saveRemote(uid, cached);
      }
      setPrefsResolved(true);
    }).catch(() => { if (!cancelled) setPrefsResolved(true); });

    // Resolve the display name and backfill the profile's first_name column
    // (what the leaderboard reads) from the sign-in metadata when it's empty.
    fetchProfile(uid).then((p) => {
      if (cancelled || userIdRef.current !== uid) return;
      const stored = (p?.first_name || '').trim();
      if (stored) { setNameState(stored); writeLocalName(uid, stored); }
      else if (metaName) { setNameState(metaName); writeLocalName(uid, metaName); upsertProfile(uid, { first_name: metaName }); }
      setNameResolved(true);
    }).catch(() => { if (!cancelled) setNameResolved(true); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      loaded,
      name,
      update: (p) =>
        setPrefs((prev) => {
          const next = { ...prev, ...p };
          const uid = userIdRef.current;
          writeLocal(uid, next);
          if (uid) saveRemote(uid, next);
          return next;
        }),
      reset: () => {
        const uid = userIdRef.current;
        writeLocal(uid, DEFAULT);
        if (uid) saveRemote(uid, DEFAULT);
        setPrefs(DEFAULT);
      },
      setName: (n) => {
        const clean = n.trim();
        setNameState(clean);
        const uid = userIdRef.current;
        if (clean) writeLocalName(uid, clean);
        if (uid && clean) upsertProfile(uid, { first_name: clean });
      },
    }),
    [prefs, prefsResolved, nameResolved, name],
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
