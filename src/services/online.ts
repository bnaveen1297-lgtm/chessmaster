import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Online 1v1 play over Supabase.
 *
 * A `matches` row is the shared game state (fen / pgn / turn / result). Both
 * clients validate moves locally with chess.js, then write the new position to
 * the row; the opponent receives it via a Realtime Postgres-changes stream.
 * Result reporting goes through the report_match_result RPC so tournament
 * scoring stays atomic and tamper-resistant.
 */

export type MatchStatus = 'open' | 'active' | 'finished' | 'aborted';

export type Match = {
  id: string;
  white_id: string | null;
  black_id: string | null;
  status: MatchStatus;
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  result: string | null;
  winner_id: string | null;
  time_control: string;
  draw_offer_by: string | null;
  tournament_id: string | null;
  round: number | null;
  board: number | null;
  created_at: string;
  updated_at: string;
};

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function client() {
  if (!supabase) {
    throw new Error('Online play needs a connection. Create a real account and sign in to play others.');
  }
  return supabase;
}

/** True when a backend is configured (so screens can show a graceful notice). */
export function onlineAvailable(): boolean {
  return !!supabase;
}

export async function currentUserId(): Promise<string> {
  const { data } = await client().auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('You must be signed in to play online.');
  return id;
}

/** Create an open challenge that anyone can join. */
export async function createOpenMatch(timeControl = 'unlimited'): Promise<Match> {
  const uid = await currentUserId();
  const { data, error } = await client()
    .from('matches')
    .insert({ white_id: uid, status: 'open', time_control: timeControl, fen: START_FEN, turn: 'w' })
    .select()
    .single();
  if (error) throw error;
  return data as Match;
}

/** Open challenges from other players (not your own, not tournament boards). */
export async function listOpenMatches(): Promise<Match[]> {
  const uid = await currentUserId();
  const { data, error } = await client()
    .from('matches')
    .select('*')
    .eq('status', 'open')
    .is('tournament_id', null)
    .neq('white_id', uid)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Match[];
}

/** Your in-progress games (casual + tournament). */
export async function listMyActiveMatches(): Promise<Match[]> {
  const uid = await currentUserId();
  const { data, error } = await client()
    .from('matches')
    .select('*')
    .eq('status', 'active')
    .or(`white_id.eq.${uid},black_id.eq.${uid}`)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Match[];
}

/** Join an open challenge as Black. Throws if it was already taken. */
export async function joinMatch(id: string): Promise<Match> {
  const uid = await currentUserId();
  const { data, error } = await client()
    .from('matches')
    .update({ black_id: uid, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'open')
    .is('black_id', null)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('That game was just taken — try another.');
  return data as Match;
}

export async function getMatch(id: string): Promise<Match> {
  const { data, error } = await client().from('matches').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Match;
}

/** Push a played move (new fen/pgn/turn) to the shared row. */
export async function pushMove(id: string, next: { fen: string; pgn: string; turn: 'w' | 'b' }): Promise<void> {
  const { error } = await client()
    .from('matches')
    .update({ ...next, draw_offer_by: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Report a final result. `result` is '1-0' | '0-1' | '1/2-1/2'. */
export async function reportResult(id: string, result: string): Promise<void> {
  const { error } = await client().rpc('report_match_result', { p_match: id, p_result: result });
  if (error) throw error;
}

export async function resign(id: string, myColor: 'w' | 'b'): Promise<void> {
  await reportResult(id, myColor === 'w' ? '0-1' : '1-0');
}

export async function offerDraw(id: string): Promise<void> {
  const uid = await currentUserId();
  const { error } = await client().from('matches').update({ draw_offer_by: uid }).eq('id', id);
  if (error) throw error;
}

export async function acceptDraw(id: string): Promise<void> {
  await reportResult(id, '1/2-1/2');
}

/** Subscribe to live updates for one match. Returns the channel to remove later. */
export function subscribeMatch(id: string, onUpdate: (m: Match) => void): RealtimeChannel {
  const ch = client()
    .channel(`match:${id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` },
      (payload) => onUpdate(payload.new as Match),
    )
    .subscribe();
  return ch;
}

/** Subscribe to the lobby (new open games appearing / being taken). */
export function subscribeLobby(onChange: () => void): RealtimeChannel {
  const ch = client()
    .channel('lobby')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => onChange())
    .subscribe();
  return ch;
}

export function unsubscribe(ch: RealtimeChannel | null | undefined): void {
  if (ch && supabase) supabase.removeChannel(ch);
}

/** Map of user id → display name, for showing opponents by name. */
export async function getNames(ids: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  if (unique.length === 0) return {};
  const { data, error } = await client().from('profiles').select('id, first_name, username').in('id', unique);
  if (error) return {};
  const out: Record<string, string> = {};
  for (const row of data ?? []) {
    out[(row as any).id] = (row as any).first_name || (row as any).username || 'Player';
  }
  return out;
}
