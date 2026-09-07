// Shared game/scoring helpers (used by the match + tournament functions).
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type MatchRow = {
  id: string;
  white_id: string | null;
  black_id: string | null;
  status: string;
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  result: string | null;
  tournament_id: string | null;
  draw_offer_by: string | null;
};

export type Result = '1-0' | '0-1' | '1/2-1/2';

async function bumpScore(admin: SupabaseClient, tid: string, uid: string, delta: number) {
  const { data } = await admin
    .from('tournament_players')
    .select('score')
    .eq('tournament_id', tid)
    .eq('user_id', uid)
    .single();
  const score = Number(data?.score ?? 0) + delta;
  await admin.from('tournament_players').update({ score }).eq('tournament_id', tid).eq('user_id', uid);
}

/** Set a match's final result and, for tournament games, update standings. */
export async function finalizeMatch(admin: SupabaseClient, match: MatchRow, result: Result) {
  if (match.status === 'finished') return; // idempotent
  const winnerId = result === '1-0' ? match.white_id : result === '0-1' ? match.black_id : null;
  await admin
    .from('matches')
    .update({ result, status: 'finished', winner_id: winnerId, draw_offer_by: null, updated_at: new Date().toISOString() })
    .eq('id', match.id)
    .neq('status', 'finished');

  if (!match.tournament_id) return;
  const { data: tour } = await admin
    .from('tournaments')
    .select('format')
    .eq('id', match.tournament_id)
    .single();
  const knockout = (tour as { format?: string } | null)?.format === 'knockout';

  if (result === '1/2-1/2') {
    if (match.white_id) await bumpScore(admin, match.tournament_id, match.white_id, 0.5);
    if (match.black_id) await bumpScore(admin, match.tournament_id, match.black_id, 0.5);
  } else {
    const winner = result === '1-0' ? match.white_id : match.black_id;
    const loser = result === '1-0' ? match.black_id : match.white_id;
    if (winner) await bumpScore(admin, match.tournament_id, winner, 1);
    if (knockout && loser) {
      await admin
        .from('tournament_players')
        .update({ eliminated: true })
        .eq('tournament_id', match.tournament_id)
        .eq('user_id', loser);
    }
  }
}
