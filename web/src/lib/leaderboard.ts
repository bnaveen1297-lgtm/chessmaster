import { supabase } from './supabase';

export type LeaderRow = { name: string; xp: number; streak_days: number };

/**
 * Top players by XP. Backed by the `public_leaderboard` RPC (migration 0008);
 * returns [] gracefully if the RPC isn't deployed yet or there's no backend.
 */
export async function fetchLeaderboard(limit = 25): Promise<LeaderRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('public_leaderboard', { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as LeaderRow[];
}
