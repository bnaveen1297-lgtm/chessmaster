// ChessMaster authoritative game server.
//
// Every state-changing action for a 1v1 game (casual online game OR a tournament
// board) goes through here. The server verifies the caller, validates the move
// with chess.js against the *stored* position, and only then writes the new
// state with the service role. Clients can no longer write game state directly
// (see migration 0003), so a player cannot forge a move, a turn, or a result.
//
// POST body: { action, matchId?, timeControl?, from?, to?, promotion? }
//   action ∈ create | join | move | resign | offer_draw | accept_draw
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { Chess } from 'https://esm.sh/chess.js@1.0.0-beta.8';
import { cors, json, err } from '../_shared/cors.ts';
import { adminClient, getUser } from '../_shared/supa.ts';
import { finalizeMatch, type MatchRow, type Result } from '../_shared/game.ts';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function rebuild(m: MatchRow): Chess {
  const g = new Chess();
  if (m.pgn && m.pgn.trim()) {
    try {
      g.loadPgn(m.pgn);
      return g;
    } catch {
      /* fall through */
    }
  }
  try {
    g.load(m.fen);
  } catch {
    /* start position */
  }
  return g;
}

function terminalResult(g: Chess): Result | null {
  if (!g.isGameOver()) return null;
  if (g.isCheckmate()) return g.turn() === 'w' ? '0-1' : '1-0';
  return '1/2-1/2'; // stalemate / repetition / insufficient / 50-move
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return err('POST only', 405);

  const user = await getUser(req);
  if (!user) return err('Not signed in.', 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return err('Invalid JSON body.');
  }
  const { action } = body;
  const admin = adminClient();

  // ---- create an open challenge ----
  if (action === 'create') {
    const { data, error } = await admin
      .from('matches')
      .insert({
        white_id: user.id,
        status: 'open',
        fen: START_FEN,
        pgn: '',
        turn: 'w',
        time_control: typeof body.timeControl === 'string' ? body.timeControl : 'unlimited',
      })
      .select()
      .single();
    if (error) return err(error.message, 500);
    return json({ match: data });
  }

  // Everything below needs a match.
  const matchId = body.matchId;
  if (!matchId) return err('matchId required.');
  const { data: matchData, error: loadErr } = await admin.from('matches').select('*').eq('id', matchId).single();
  if (loadErr || !matchData) return err('Match not found.', 404);
  const match = matchData as MatchRow;

  const color: 'w' | 'b' | null =
    match.white_id === user.id ? 'w' : match.black_id === user.id ? 'b' : null;

  // ---- join an open game as Black ----
  if (action === 'join') {
    if (match.status !== 'open' || match.black_id) return err('That game is no longer open.');
    if (match.white_id === user.id) return err("You can't join your own game.");
    const { data, error } = await admin
      .from('matches')
      .update({ black_id: user.id, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', matchId)
      .eq('status', 'open')
      .is('black_id', null)
      .select()
      .single();
    if (error) return err('That game was just taken.', 409);
    return json({ match: data });
  }

  if (color === null) return err('You are not a player in this game.', 403);
  if (match.status !== 'active') return err('This game is not in progress.');

  // ---- resign ----
  if (action === 'resign') {
    await finalizeMatch(admin, match, color === 'w' ? '0-1' : '1-0');
    return json({ ok: true });
  }

  // ---- draw offer / accept ----
  if (action === 'offer_draw') {
    await admin.from('matches').update({ draw_offer_by: user.id }).eq('id', matchId);
    return json({ ok: true });
  }
  if (action === 'accept_draw') {
    if (!match.draw_offer_by || match.draw_offer_by === user.id) {
      return err('No draw offer from your opponent to accept.');
    }
    await finalizeMatch(admin, match, '1/2-1/2');
    return json({ ok: true });
  }

  // ---- make a move (the authoritative bit) ----
  if (action === 'move') {
    const g = rebuild(match);
    if (g.turn() !== color) return err('Not your turn.', 409);
    const { from, to } = body;
    if (typeof from !== 'string' || typeof to !== 'string') return err('from/to required.');
    let mv;
    try {
      mv = g.move({ from, to, promotion: (body.promotion as string) || 'q' });
    } catch {
      mv = null;
    }
    if (!mv) return err('Illegal move.', 422);

    const next = { fen: g.fen(), pgn: g.pgn(), turn: g.turn() as 'w' | 'b' };
    const term = terminalResult(g);

    const { error: upErr } = await admin
      .from('matches')
      .update({ ...next, draw_offer_by: null, updated_at: new Date().toISOString() })
      .eq('id', matchId)
      .eq('status', 'active');
    if (upErr) return err(upErr.message, 500);

    if (term) {
      // Re-read minimal fields not needed; finalize uses the in-memory match + new ids unchanged.
      await finalizeMatch(admin, { ...match, ...next }, term);
    }
    return json({ ok: true, fen: next.fen, gameOver: !!term, result: term });
  }

  return err('Unknown action.');
});
