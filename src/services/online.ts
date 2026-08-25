import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Online 1v1 play over Supabase — server-authoritative.
 *
 * A `matches` row is the shared game state (fen / pgn / turn / result). Reads
 * and the live stream stay client-side (Realtime Postgres changes), but every
 * WRITE — create, join, move, resign, draw — goes through the `match` Edge
 * Function, which validates the move with chess.js and writes with the service
 * role. Clients can't write game state directly (migration 0003).
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

/**
 * Call an authoritative Edge Function. All game writes (create/join/move/resign/
 * draw) go through the server, which validates them with chess.js — clients can't
 * write game state directly (see migration 0003).
 */
async function invokeFn<T = any>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await client().functions.invoke(name, { body });
  if (error) {
    // Surface the function's own error message when present.
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

export async function currentUserId(): Promise<string> {
  const { data } = await client().auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error('You must be signed in to play online.');
  return id;
}

/** Create an open challenge that anyone can join (server-side). */
export async function createOpenMatch(timeControl = 'unlimited'): Promise<Match> {
  const { match } = await invokeFn<{ match: Match }>('match', { action: 'create', timeControl });
  return match;
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

/** Join an open challenge as Black (server-side). Throws if already taken. */
export async function joinMatch(id: string): Promise<Match> {
  const { match } = await invokeFn<{ match: Match }>('match', { action: 'join', matchId: id });
  return match;
}

export async function getMatch(id: string): Promise<Match> {
  const { data, error } = await client().from('matches').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Match;
}

/**
 * Send a move to the server. The server validates legality against the stored
 * position and writes the new state; the board updates arrive via Realtime.
 * Returns { gameOver, result } so the caller can react immediately.
 */
export async function makeMove(
  id: string,
  from: string,
  to: string,
  promotion?: string,
): Promise<{ gameOver: boolean; result: string | null; fen: string }> {
  return invokeFn('match', { action: 'move', matchId: id, from, to, promotion });
}

export async function resign(id: string): Promise<void> {
  await invokeFn('match', { action: 'resign', matchId: id });
}

export async function offerDraw(id: string): Promise<void> {
  await invokeFn('match', { action: 'offer_draw', matchId: id });
}

export async function acceptDraw(id: string): Promise<void> {
  await invokeFn('match', { action: 'accept_draw', matchId: id });
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
