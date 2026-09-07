import { supabase } from './supabase';
import type { TournamentFormat } from '../tournament/pairing';
import { currentUserId, type Match } from './online';

/** Call an authoritative Edge Function (round generation runs server-side). */
async function invokeFn<T = any>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Tournaments need a connection. Sign in with an account.');
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let msg = error.message || 'Server error.';
    try {
      const ctx = (error as any).context;
      const parsed = ctx && typeof ctx.json === 'function' ? await ctx.json() : null;
      if (parsed?.error) msg = parsed.error;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  if (data && (data as any).error) throw new Error((data as any).error);
  return data as T;
}

/**
 * Tournaments over Supabase. Two formats: round-robin (everyone plays everyone)
 * and knockout (single elimination). Reads (list, standings, pairings) are
 * client-side; start/advance go through the `tournament` Edge Function, which
 * generates pairings server-side (same engine as src/tournament/pairing.ts) and
 * creates the boards with the service role. Anyone can create/join; the
 * organizer starts and advances rounds.
 */

export type Tournament = {
  id: string;
  name: string;
  format: TournamentFormat;
  status: 'lobby' | 'running' | 'finished';
  created_by: string;
  max_players: number;
  current_round: number;
  total_rounds: number | null;
  time_control: string;
  created_at: string;
};

export type TournamentPlayer = {
  tournament_id: string;
  user_id: string;
  seed: number | null;
  score: number;
  eliminated: boolean;
  joined_at: string;
};

function client() {
  if (!supabase) {
    throw new Error('Tournaments need a connection. Create a real account and sign in.');
  }
  return supabase;
}

export function tournamentsAvailable(): boolean {
  return !!supabase;
}

export async function listTournaments(): Promise<Tournament[]> {
  const { data, error } = await client()
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Tournament[];
}

export async function getTournament(id: string): Promise<Tournament> {
  const { data, error } = await client().from('tournaments').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Tournament;
}

export async function createTournament(input: {
  name: string;
  format: TournamentFormat;
  maxPlayers: number;
  timeControl?: string;
}): Promise<Tournament> {
  const uid = await currentUserId();
  const { data, error } = await client()
    .from('tournaments')
    .insert({
      name: input.name,
      format: input.format,
      max_players: input.maxPlayers,
      time_control: input.timeControl ?? 'unlimited',
      created_by: uid,
    })
    .select()
    .single();
  if (error) throw error;
  // Organizer auto-joins.
  await client().from('tournament_players').insert({ tournament_id: (data as Tournament).id, user_id: uid });
  return data as Tournament;
}

export async function listPlayers(tid: string): Promise<TournamentPlayer[]> {
  const { data, error } = await client()
    .from('tournament_players')
    .select('*')
    .eq('tournament_id', tid)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as TournamentPlayer[];
}

export async function joinTournament(tid: string): Promise<void> {
  const uid = await currentUserId();
  const { error } = await client().from('tournament_players').insert({ tournament_id: tid, user_id: uid });
  if (error) throw error;
}

export async function leaveTournament(tid: string): Promise<void> {
  const uid = await currentUserId();
  const { error } = await client()
    .from('tournament_players')
    .delete()
    .eq('tournament_id', tid)
    .eq('user_id', uid);
  if (error) throw error;
}

export async function matchesForRound(tid: string, round: number): Promise<Match[]> {
  const { data, error } = await client()
    .from('matches')
    .select('*')
    .eq('tournament_id', tid)
    .eq('round', round)
    .order('board', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Match[];
}

export async function myMatchInRound(tid: string, round: number, uid: string): Promise<Match | null> {
  const rows = await matchesForRound(tid, round);
  return rows.find((m) => m.white_id === uid || m.black_id === uid) ?? null;
}

/** Standings sorted by score (desc), then join order. */
export async function standings(tid: string): Promise<TournamentPlayer[]> {
  const players = await listPlayers(tid);
  return [...players].sort((a, b) => b.score - a.score || a.joined_at.localeCompare(b.joined_at));
}

/**
 * Start the tournament (organizer only). Pairings are generated and the boards
 * are created server-side by the `tournament` Edge Function.
 */
export async function startTournament(t: Tournament): Promise<void> {
  await invokeFn('tournament', { action: 'start', tournamentId: t.id });
}

/** Whether every board in the given round has a result. */
export async function roundComplete(tid: string, round: number): Promise<boolean> {
  const rows = await matchesForRound(tid, round);
  return rows.length > 0 && rows.every((m) => m.status === 'finished');
}

/**
 * Advance to the next round (organizer only). The server verifies the round is
 * complete, computes the next pairings and creates the boards. Returns
 * 'finished' when the event is over, or the new round number.
 */
export async function advanceRound(t: Tournament): Promise<'finished' | number> {
  const res = await invokeFn<{ finished?: boolean; round?: number }>('tournament', {
    action: 'advance',
    tournamentId: t.id,
  });
  return res.finished ? 'finished' : (res.round ?? t.current_round + 1);
}
