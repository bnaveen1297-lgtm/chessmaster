import { supabase, isSupabaseConfigured } from './supabase';
import { rowToMasterGame, type MasterRow } from './masterRow';
import type { MasterGame } from '../data/masters';

/**
 * The master-games database (millions of real games) served from Supabase.
 * Falls back to the bundled classics in the app when the DB isn't loaded.
 * The row→MasterGame converter lives in masterRow.ts (pure, unit-tested).
 */

export { rowToMasterGame };
export type { MasterRow };

export function masterDbAvailable(): boolean {
  return isSupabaseConfigured && !!supabase;
}

/** A batch of random master games from the DB (optionally above an Elo floor). */
export async function fetchRandomMasterGames(count = 12, minElo = 0): Promise<MasterGame[]> {
  if (!supabase) throw new Error('Master database not configured.');
  const { data, error } = await supabase.rpc('random_master_games', { p_count: count, p_min_elo: minElo });
  if (error) throw error;
  return ((data ?? []) as MasterRow[]).map(rowToMasterGame);
}
