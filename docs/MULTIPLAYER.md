# Online play, Tournaments & the Master Base

This document covers the features added on top of the single-player app.

## What's built

### Play Online (real-time 1v1)
- **Lobby** (`OnlineLobbyScreen`): create an open challenge or join someone else's.
- **Live board** (`OnlineGameScreen`): both players share a `matches` row. Each
  move is validated locally with chess.js, written to the row, and streamed to
  the opponent via Supabase Realtime (Postgres changes). Resign, offer/accept
  draw, and automatic result + XP on game end.
- Service layer: `src/services/online.ts`.

### Tournaments (two formats)
- **Round-robin** — everyone plays everyone once (circle method, colour-balanced).
- **Knockout** — single elimination with standard bracket seeding + byes.
- `TournamentsScreen` (browse/create), `TournamentDetailScreen` (join, start,
  standings, per-round pairings, "your game is ready", advance round, champion).
- Pairing engine: `src/tournament/pairing.ts` (pure, unit-tested by
  `npm run test:tournament` — 36 assertions).
- Service layer: `src/services/tournaments.ts`.
- Scoring + round generation run through `SECURITY DEFINER` RPCs
  (`create_tournament_round`, `report_match_result`) so results can't be forged.

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

## Applying the database migration

Online play + tournaments need the schema in
`supabase/migrations/0002_multiplayer.sql` (tables `matches`, `tournaments`,
`tournament_players`, RLS, the two RPCs, and Realtime replication).

Apply it once to the ChessMaster Supabase project. Either:

**Supabase SQL editor** — paste the contents of `0002_multiplayer.sql` and run.

**Supabase CLI**
```bash
supabase link --project-ref evmjrxxrfumrggzmtpam
supabase db push        # or: supabase db execute -f supabase/migrations/0002_multiplayer.sql
```

The migration is idempotent (safe to re-run). After it's applied, Realtime is
enabled on the three tables automatically.

## Honest limitations
- **Move validation is client-side** (chess.js on both clients). This is a
  friendly B2C setting, not an anti-cheat arena — server-authoritative
  validation would need an edge function running chess.js and is future work.
- The sandbox used to build this **cannot reach `*.supabase.co`**, so live
  Realtime multiplayer was not exercised end-to-end here; it must be verified on
  a real device / deployment. The pure logic (pairings, PGNs, engine) *is*
  fully tested.
- Featured/Olympiad boards are **verified historical games**, not a live
  Olympiad feed (no free live-board API); live boards stream from FIDE during
  the event.
