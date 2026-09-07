// ChessMaster tournament server.
//
// Round generation and scoring run here, not on the organizer's phone. The
// server verifies the caller is the organizer, computes pairings with the same
// engine the app uses, and writes the boards with the service role.
//
// Formats: round-robin, knockout (single elimination), and Swiss.
// Boards are created with the tournament's time control.
//
// POST body: { action, tournamentId }
//   action ∈ start | advance
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { cors, json, err } from '../_shared/cors.ts';
import { adminClient, getUser } from '../_shared/supa.ts';
import {
  roundRobinSchedule,
  knockoutFirstRound,
  pairWinners,
  knockoutRounds,
  swissFirstRound,
  swissPairings,
  swissRounds,
  type Pairing,
  type SwissEntrant,
} from '../_shared/pairing.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

async function bumpByeScore(admin: SupabaseClient, tid: string, uid: string) {
  const { data } = await admin.from('tournament_players').select('score').eq('tournament_id', tid).eq('user_id', uid).single();
  await admin.from('tournament_players').update({ score: Number((data as { score?: number } | null)?.score ?? 0) + 1 }).eq('tournament_id', tid).eq('user_id', uid);
}

async function insertRound(admin: SupabaseClient, tid: string, round: number, pairings: Pairing[], timeControl: string) {
  for (const p of pairings) {
    if (!p.black) {
      // Bye: white takes a full point immediately.
      await admin.from('matches').insert({
        white_id: p.white, black_id: null, status: 'finished', result: '1-0',
        winner_id: p.white, tournament_id: tid, round, board: p.board,
      });
      await bumpByeScore(admin, tid, p.white);
    } else {
      await admin.from('matches').insert({
        white_id: p.white, black_id: p.black, status: 'active', fen: START_FEN, turn: 'w',
        time_control: timeControl, tournament_id: tid, round, board: p.board,
      });
    }
  }
}

/** Build Swiss standings (score, opponents faced, byes taken) from finished boards. */
async function swissEntrants(admin: SupabaseClient, tid: string, ids: string[]): Promise<SwissEntrant[]> {
  const { data: prows } = await admin.from('tournament_players').select('user_id, score').eq('tournament_id', tid);
  const scoreOf: Record<string, number> = {};
  for (const r of (prows ?? []) as { user_id: string; score: number }[]) scoreOf[r.user_id] = Number(r.score ?? 0);
  const { data: mrows } = await admin.from('matches').select('white_id, black_id').eq('tournament_id', tid);
  const opps: Record<string, string[]> = {};
  const bye: Record<string, boolean> = {};
  for (const m of (mrows ?? []) as { white_id: string | null; black_id: string | null }[]) {
    if (m.white_id && m.black_id) {
      (opps[m.white_id] ??= []).push(m.black_id);
      (opps[m.black_id] ??= []).push(m.white_id);
    } else if (m.white_id && !m.black_id) {
      bye[m.white_id] = true;
    }
  }
  return ids.map((id) => ({ id, score: scoreOf[id] ?? 0, opponents: opps[id] ?? [], hadBye: !!bye[id] }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return err('POST only', 405);

  const user = await getUser(req);
  if (!user) return err('Not signed in.', 401);

  let body: any;
  try { body = await req.json(); } catch { return err('Invalid JSON body.'); }
  const { action, tournamentId } = body;
  if (!tournamentId) return err('tournamentId required.');

  const admin = adminClient();
  const { data: tour, error: tErr } = await admin.from('tournaments').select('*').eq('id', tournamentId).single();
  if (tErr || !tour) return err('Tournament not found.', 404);
  if (tour.created_by !== user.id) return err('Only the organizer can do that.', 403);
  const timeControl: string = tour.time_control ?? 'unlimited';

  const { data: playerRows } = await admin
    .from('tournament_players')
    .select('user_id, joined_at')
    .eq('tournament_id', tournamentId)
    .order('joined_at', { ascending: true });
  const ids: string[] = (playerRows ?? []).map((p: { user_id: string }) => p.user_id);

  if (action === 'start') {
    if (tour.status !== 'lobby') return err('Already started.');
    if (ids.length < 2) return err('Need at least 2 players.');

    let firstRound: Pairing[];
    let totalRounds: number;
    if (tour.format === 'roundrobin') {
      const schedule = roundRobinSchedule(ids);
      firstRound = schedule[0].pairings;
      totalRounds = schedule.length;
    } else if (tour.format === 'swiss') {
      firstRound = swissFirstRound(ids).pairings;
      totalRounds = swissRounds(ids.length);
    } else {
      firstRound = knockoutFirstRound(ids).pairings;
      totalRounds = knockoutRounds(ids.length);
    }
    await admin.from('tournaments').update({ status: 'running', current_round: 1, total_rounds: totalRounds }).eq('id', tournamentId);
    await insertRound(admin, tournamentId, 1, firstRound, timeControl);
    return json({ ok: true, round: 1, totalRounds });
  }

  if (action === 'advance') {
    if (tour.status !== 'running') return err('Tournament is not running.');
    const current = tour.current_round as number;

    const { data: roundMatches } = await admin
      .from('matches').select('*').eq('tournament_id', tournamentId).eq('round', current)
      .order('board', { ascending: true });
    const rows = roundMatches ?? [];
    if (rows.length === 0 || !rows.every((m: { status: string }) => m.status === 'finished')) {
      return err('All games in this round must finish first.');
    }
    const nextRound = current + 1;

    if (tour.format === 'roundrobin') {
      const schedule = roundRobinSchedule(ids);
      if (nextRound > schedule.length) {
        await admin.from('tournaments').update({ status: 'finished' }).eq('id', tournamentId);
        return json({ ok: true, finished: true });
      }
      await admin.from('tournaments').update({ current_round: nextRound }).eq('id', tournamentId);
      await insertRound(admin, tournamentId, nextRound, schedule[nextRound - 1].pairings, timeControl);
      return json({ ok: true, round: nextRound });
    }

    if (tour.format === 'swiss') {
      const total = (tour.total_rounds as number) || swissRounds(ids.length);
      if (nextRound > total) {
        await admin.from('tournaments').update({ status: 'finished' }).eq('id', tournamentId);
        return json({ ok: true, finished: true });
      }
      const entrants = await swissEntrants(admin, tournamentId, ids);
      const next = swissPairings(entrants, nextRound);
      await admin.from('tournaments').update({ current_round: nextRound }).eq('id', tournamentId);
      await insertRound(admin, tournamentId, nextRound, next.pairings, timeControl);
      return json({ ok: true, round: nextRound });
    }

    // knockout: winners in board order
    const winners: string[] = [];
    for (const m of rows) {
      if (m.result === '1-0' && m.white_id) winners.push(m.white_id);
      else if (m.result === '0-1' && m.black_id) winners.push(m.black_id);
      else if (m.white_id) winners.push(m.white_id);
    }
    const next = pairWinners(winners, nextRound);
    if (!next) {
      await admin.from('tournaments').update({ status: 'finished' }).eq('id', tournamentId);
      return json({ ok: true, finished: true });
    }
    await admin.from('tournaments').update({ current_round: nextRound }).eq('id', tournamentId);
    await insertRound(admin, tournamentId, nextRound, next.pairings, timeControl);
    return json({ ok: true, round: nextRound });
  }

  return err('Unknown action.');
});
