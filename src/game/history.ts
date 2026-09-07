import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';

/**
 * Local + cloud game history.
 *
 * Every finished game (vs computer, pass & play, vs master, online) is saved
 * here so it can be reviewed later. Records are written to on-device storage
 * (works offline, instant) and, when a backend is configured and the user is
 * signed in, mirrored to the `games` table for cross-device history.
 */

export type GameMode = 'computer' | 'friend' | 'master' | 'online';

export type GameRecord = {
  id: string;
  mode: GameMode;
  result: string; // '1-0' | '0-1' | '1/2-1/2'
  pgn: string;
  white: string;
  black: string;
  date: string; // ISO
};

const KEY = 'chessmaster.games';
const MAX = 60;

const MODE_LABEL: Record<GameMode, string> = {
  computer: 'vs Computer',
  friend: 'Pass & Play',
  master: 'vs Master',
  online: 'Online',
};

export function modeLabel(mode: GameMode): string {
  return MODE_LABEL[mode] ?? mode;
}

/** Persist a finished game. Best-effort — never throws into the game UI. */
export async function saveGame(input: {
  mode: GameMode;
  result: string;
  pgn: string;
  white?: string;
  black?: string;
}): Promise<void> {
  const rec: GameRecord = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    mode: input.mode,
    result: input.result,
    pgn: input.pgn,
    white: input.white ?? 'White',
    black: input.black ?? 'Black',
    date: new Date().toISOString(),
  };

  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: GameRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift(rec);
    await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore storage errors */
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (uid) {
        await supabase.from('games').insert({ user_id: uid, mode: input.mode, result: input.result, pgn: input.pgn });
      }
    } catch {
      /* offline / not signed in — local copy is enough */
    }
  }
}

/** Most-recent games first (from on-device storage). */
export async function listGames(): Promise<GameRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameRecord[]) : [];
  } catch {
    return [];
  }
}

export async function clearGames(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
