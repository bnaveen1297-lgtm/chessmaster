import { supabase } from './supabase';
import {
  roundRobinSchedule,
  knockoutFirstRound,
  pairWinners,
  knockoutRounds,
  type Pairing,
  type TournamentFormat,
} from '../tournament/pairing';
import { currentUserId, type Match } from './online';

/**
 * Tournaments over Supabase. Two formats: round-robin (everyone plays everyone)
 * and knockout (single elimination). Pairings are computed with the pure engine
 * in src/tournament/pairing.ts and persisted via the create_tournament_round
 * RPC; results + scoring flow through report_match_result. Anyone can create
 * one; the organizer starts it and advances rounds.
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
}): Promise<Tournament> {
  const uid = await currentUserId();
  const { data, error } = await client()
    .from('tournaments')
    .insert({
      name: input.name,
      format: input.format,
      max_players: input.maxPlayers,
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

function toJson(pairings: Pairing[]) {
  return pairings.map((p) => ({ white: p.white, black: p.black, board: p.board }));
}

/**
 * Start the tournament: seed players by join order, compute round 1, persist it.
 * (Organizer only — enforced by the RPC.)
 */
export async function startTournament(t: Tournament): Promise<void> {
  const players = await listPlayers(t.id); // ordered by joined_at = seed order
  const ids = players.map((p) => p.user_id);
  if (ids.length < 2) throw new Error('Need at least 2 players to start.');

  let firstRound: Pairing[];
  let totalRounds: number;
  if (t.format === 'roundrobin') {
    const schedule = roundRobinSchedule(ids);
    firstRound = schedule[0].pairings;
    totalRounds = schedule.length;
  } else {
    const r1 = knockoutFirstRound(ids);
    firstRound = r1.pairings;
    totalRounds = knockoutRounds(ids.length);
  }

  await client().from('tournaments').update({ total_rounds: totalRounds }).eq('id', t.id);
  const { error } = await client().rpc('create_tournament_round', {
    p_tid: t.id,
    p_round: 1,
    p_pairings: toJson(firstRound),
  });
  if (error) throw error;
}

/** Whether every board in the given round has a result. */
export async function roundComplete(tid: string, round: number): Promise<boolean> {
  const rows = await matchesForRound(tid, round);
  return rows.length > 0 && rows.every((m) => m.status === 'finished');
}

/**
 * Advance to the next round (organizer only). Returns 'finished' when the event
 * is over, or the new round number.
 */
export async function advanceRound(t: Tournament): Promise<'finished' | number> {
  const current = t.current_round;
  if (!(await roundComplete(t.id, current))) {
    throw new Error('All games in this round must finish first.');
  }
  const players = await listPlayers(t.id);
  const ids = players.map((p) => p.user_id);
  const nextRound = current + 1;

  if (t.format === 'roundrobin') {
    const schedule = roundRobinSchedule(ids);
    if (nextRound > schedule.length) {
      await client().from('tournaments').update({ status: 'finished' }).eq('id', t.id);
      return 'finished';
    }
    const { error } = await client().rpc('create_tournament_round', {
      p_tid: t.id,
      p_round: nextRound,
      p_pairings: toJson(schedule[nextRound - 1].pairings),
    });
    if (error) throw error;
    return nextRound;
  }

  // knockout: winners of this round, in bracket (board) order.
  const rows = await matchesForRound(t.id, current);
  const winners: string[] = [];
  for (const m of rows.sort((a, b) => (a.board ?? 0) - (b.board ?? 0))) {
    if (m.result === '1-0' && m.white_id) winners.push(m.white_id);
    else if (m.result === '0-1' && m.black_id) winners.push(m.black_id);
    else if (m.white_id) winners.push(m.white_id); // bye / draw fallback
  }
  const next = pairWinners(winners, nextRound);
  if (!next) {
    await client().from('tournaments').update({ status: 'finished' }).eq('id', t.id);
    return 'finished';
  }
  const { error } = await client().rpc('create_tournament_round', {
    p_tid: t.id,
    p_round: nextRound,
    p_pairings: toJson(next.pairings),
  });
  if (error) throw error;
  return nextRound;
}
