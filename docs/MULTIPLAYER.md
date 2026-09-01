# Online play, Tournaments & the Master Base

This document covers the features added on top of the single-player app.

## What's built

### Play Online (real-time 1v1) — server-authoritative
- **Lobby** (`OnlineLobbyScreen`): create an open challenge or join someone else's.
- **Live board** (`OnlineGameScreen`): both players share a `matches` row. Every
  move goes to the **`match` Edge Function**, which verifies the caller, validates
  the move with chess.js against the *stored* position, and writes the new state
  with the service role. The opponent receives it via Supabase Realtime. Resign,
  offer/accept draw, and automatic result + XP on game end — all server-side.
- Clients **cannot write game state directly** (migration 0003 removes that RLS
  access), so a player can't forge a move, a turn, or a result.
- Service layer: `src/services/online.ts` → `supabase/functions/match/`.

### Tournaments (two formats)
- **Round-robin** — everyone plays everyone once (circle method, colour-balanced).
- **Knockout** — single elimination with standard bracket seeding + byes.
- `TournamentsScreen` (browse/create), `TournamentDetailScreen` (join, start,
  standings, per-round pairings, "your game is ready", advance round, champion).
- Pairing engine: `src/tournament/pairing.ts` (pure, unit-tested by
  `npm run test:tournament` — 36 assertions).
- Service layer: `src/services/tournaments.ts` → `supabase/functions/tournament/`.
- Round generation, board creation and scoring run **server-side** in the
  `tournament` Edge Function (which verifies the caller is the organizer), so
  pairings and results can't be forged. (Create/join/leave stay client-side —
  those aren't cheatable.)

### Master Base (play real GM games)
- A curated library of **verified** grandmaster/master games
  (`src/data/masters.ts`). Every PGN is checked to parse and reach its stated
  result by `npm run verify:masters` (runs in CI).
- `MasterBaseScreen` (browse/filter), `MasterGameScreen` (watch / play / analyse).
- **Play vs Master** (`PlayVsMasterScreen`): the opponent replays the master's
  real moves while you follow the game's path; the moment you deviate, the engine
  takes over so you can try to beat the line. Shows how many master moves you matched.

### Olympiad theme (Samarkand 2026)
- `OlympiadScreen` + `src/data/olympiad.ts`: the real 46th FIDE Chess Olympiad
  (Samarkand, Uzbekistan, 15–27 Sep 2026), a live countdown, event facts, top
  teams & stars, and featured boards. Home leads with the countdown.

## Setup (do these in order)

Online play + tournaments need three things applied to the ChessMaster Supabase
project. **Order matters** — deploy the functions *before* locking down writes.

### 1. Base schema — migration 0002
Tables `matches`, `tournaments`, `tournament_players`, RLS, and Realtime.
Paste `supabase/migrations/0002_multiplayer.sql` into the Supabase SQL editor, or:
```bash
supabase link --project-ref evmjrxxrfumrggzmtpam
supabase db push
```

### 2. Deploy the game server (Edge Functions)
```bash
supabase functions deploy match
supabase functions deploy tournament
```
No secrets to set — `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically. JWT verification is on by
default, and the client sends the signed-in user's token, so the functions always
know who is acting.

### 3. Lock down client writes — migration 0003
Run `supabase/migrations/0003_server_authoritative.sql` **after** the functions
are deployed. It removes clients' ability to write `matches` directly (reads and
Realtime stay open) and drops the old RPCs the functions now replace.

All migrations are idempotent (safe to re-run). Until step 3 is applied the game
still works, but a determined client could write state directly — step 3 is what
makes the server authoritative.

## Honest limitations
- **Move validation is server-authoritative** — the `match` function re-validates
  every move with chess.js before writing, and derives results from real board
  state, so moves/turns/results can't be forged once steps 2–3 are applied.
- The sandbox used to build this **cannot reach `*.supabase.co`** and has **no
  Deno**, so the Edge Functions were **not run or tested here** — they must be
  deployed and exercised on a real device / deployment. The app's own pure logic
  (pairings, PGNs, engine — 80 tests) *is* fully tested, and the functions reuse
  the same pairing engine.
- Featured/Olympiad boards are **verified historical games**, not a live
  Olympiad feed (no free live-board API); live boards stream from FIDE during
  the event.
