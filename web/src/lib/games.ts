import { supabase } from './supabase';

export type StoredGame = {
  id: number;
  mode: string;
  result: string | null;
  pgn: string | null;
  white?: string | null;
  black?: string | null;
  created_at: string;
};

/** Persist an imported game to the user's `games` table (best-effort). */
export async function saveImportedGame(uid: string, g: { result: string; pgn: string; white?: string; black?: string }): Promise<void> {
  if (!supabase || !uid) return;
  const result = ['1-0', '0-1', '1/2-1/2'].includes(g.result) ? g.result : null;
  await supabase.from('games').insert({ user_id: uid, mode: 'import', result, pgn: g.pgn });
}

/** The user's stored games, newest first. */
export async function listMyGames(uid: string, limit = 20): Promise<StoredGame[]> {
  if (!supabase || !uid) return [];
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as StoredGame[];
}
