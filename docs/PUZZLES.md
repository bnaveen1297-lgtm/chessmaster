# Puzzles & live Olympiad boards

## The puzzle database (millions of puzzles)

ChessMaster serves puzzles from three sources, in order, so it always has a
puzzle to show:

1. **The Supabase puzzle database** — the full **Lichess puzzle database**
   (CC0, ~5 million puzzles), loaded into your project. Filtered by rating band
   and served randomly at O(log n) via a `rnd` key (no slow `ORDER BY random()`).
2. **Live free APIs** — Chess.com / Lichess, when the database isn't loaded.
3. **Bundled offline set** — the curated, machine-verified puzzles that ship in
   the app.

Plus a **Daily Puzzle** (the Lichess daily — same for everyone, changes daily).

Raw rows are stored as-is (FEN + UCI moves); the app converts a row into a
playable puzzle on the device (`src/services/lichessPuzzle.ts`, unit-tested by
`npm run test:puzzledb`).

### Load the database (one time)

1. Apply the schema — `supabase/migrations/0004_puzzles.sql` (table, indexes,
   RLS public-read, and the `random_puzzle` RPC).
2. Import the data. The Lichess dump is a zstd-compressed CSV; the importer
   streams decompressed CSV from stdin, so memory stays flat at any size:

   ```bash
   export SUPABASE_URL="https://evmjrxxrfumrggzmtpam.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="<service-role key>"   # server key, NOT the anon key
   curl -s https://database.lichess.org/lichess_db_puzzle.csv.zst \
     | zstd -d \
     | node scripts/import-lichess-puzzles.mjs
   ```

   The full set is a few GB in Postgres. On the Supabase free tier, import a
   subset instead:

   ```bash
   LIMIT=1000000 ...            # first 1,000,000
   MIN_RATING=1000 MAX_RATING=2200 ...   # a rating band
   ```

That's it — the app automatically prefers the database once it has rows.

> The build sandbox blocks `database.lichess.org` and `*.supabase.co`, so this
> import must run from a machine with network + your Supabase service key. The
> conversion logic is fully unit-tested regardless.

## Live Olympiad boards (the DGT boards)

The physical **DGT boards** at the Olympiad feed the organizer's relay, and
**Lichess re-broadcasts** major events (including the FIDE Olympiad) through its
Broadcast API. ChessMaster reads that relay — you can't connect to the DGT
hardware directly.

- Service: `src/services/broadcast.ts`
  - `GET https://lichess.org/api/broadcast` — find the Olympiad broadcast + its current round.
  - `GET https://lichess.org/api/broadcast/round/{roundId}.pgn` — the PGN of every board on that round.
- Screen: **Olympiad → Live boards** (`LiveBoardsScreen`) lists the round's
  boards; tap one to follow it. During the event these are the real games; when
  no broadcast is live it shows a graceful "check back during the Olympiad"
  state, and the Featured (Master Base) boards remain available.

> Also blocked in the sandbox (lichess.org 403); works on a real device / the
> deployed web build.
