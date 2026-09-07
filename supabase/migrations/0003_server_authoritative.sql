-- ChessMaster: make the game server authoritative.
--
-- With the `match` and `tournament` Edge Functions in place (they use the
-- service role and validate every move with chess.js), clients must no longer
-- be able to write game state directly. This migration removes client write
-- access to `matches` — reads/Realtime stay open for playing and spectating —
-- and drops the old client-callable RPCs, whose jobs the functions now own.
--
-- Apply this ONLY together with deploying the functions (see docs/MULTIPLAYER.md).
-- Until both are in place, online writes are refused, which is the safe state.

-- Clients can still SELECT matches (needed for the live board + lobby + Realtime)
-- but can no longer INSERT or UPDATE them. Creating a game, joining, moving,
-- resigning and offering/accepting draws all go through the `match` function.
drop policy if exists "matches insert" on public.matches;
drop policy if exists "matches update" on public.matches;

-- The old RPCs are superseded by the Edge Functions (which verify the caller and
-- derive results from real board state, so results/scores can't be forged).
drop function if exists public.create_tournament_round(uuid, int, jsonb);
drop function if exists public.report_match_result(uuid, text);

-- Note: tournament create/join/leave stay client-side (not cheatable) — a player
-- may still INSERT their own tournaments and add/remove themselves as a player.
-- Round generation, board creation and scoring are server-only via the functions.
