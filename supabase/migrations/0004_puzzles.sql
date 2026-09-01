-- ChessMaster puzzle database (Lichess CC0, ~5M puzzles)
--
-- Stores the raw Lichess puzzle rows and serves fast, filtered random puzzles.
-- The client converts a raw row (FEN + UCI moves) into a playable puzzle on the
-- fly (see src/services/lichessPuzzle.ts). Load the data once with
-- scripts/import-lichess-puzzles.mjs — see docs/PUZZLES.md.

create table if not exists public.puzzles (
  id                text primary key,          -- Lichess PuzzleId
  fen               text not null,             -- position before the setup move
  moves             text not null,             -- space-separated UCI (1st = setup)
  rating            int  not null,
  rating_deviation  int,
  popularity        int,
  nb_plays          int,
  themes            text not null default '',  -- space-separated theme tokens
  game_url          text,
  opening_tags      text,
  -- A stable random key gives O(log n) random selection at any scale (no
  -- "order by random()" full scan over millions of rows).
  rnd               double precision not null default random()
);

create index if not exists puzzles_rating_rnd_idx on public.puzzles (rating, rnd);
create index if not exists puzzles_rnd_idx on public.puzzles (rnd);

-- Puzzles are public reference data: anyone signed in (or anon) may read them.
alter table public.puzzles enable row level security;
drop policy if exists "puzzles readable" on public.puzzles;
create policy "puzzles readable" on public.puzzles for select using (true);

-- Robust random puzzle with optional rating band + theme. Uses the rnd key with
-- a wrap-around fallback so it stays O(log n) even at 5M rows.
create or replace function public.random_puzzle(
  min_rating int default 0,
  max_rating int default 4000,
  want_theme text default null
) returns setof public.puzzles
language plpgsql stable
as $$
declare
  x double precision := random();
begin
  return query
    select * from public.puzzles p
    where p.rating between min_rating and max_rating
      and (want_theme is null or p.themes ~* ('\y' || want_theme || '\y'))
      and p.rnd >= x
    order by p.rnd
    limit 1;
  if not found then
    return query
      select * from public.puzzles p
      where p.rating between min_rating and max_rating
        and (want_theme is null or p.themes ~* ('\y' || want_theme || '\y'))
      order by p.rnd
      limit 1;
  end if;
end;
$$;
