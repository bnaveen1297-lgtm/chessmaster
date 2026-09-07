-- ChessMaster master-games database (millions of real games)
--
-- Stores whole games (PGN + headers) so the Master Base can serve millions of
-- grandmaster/master games, not just the bundled classics. Load it once from a
-- free master PGN collection (e.g. the Lichess Elite database, or Caissabase)
-- with scripts/import-pgn-games.mjs — see docs/PUZZLES.md / docs comments.

create table if not exists public.master_games (
  id         bigint generated always as identity primary key,
  white      text,
  black      text,
  result     text,           -- '1-0' | '0-1' | '1/2-1/2'
  event      text,
  site       text,
  game_date  text,           -- PGN Date tag (YYYY.MM.DD or partial)
  white_elo  int,
  black_elo  int,
  eco        text,
  opening    text,
  ply        int,
  pgn        text not null,
  rnd        double precision not null default random()  -- O(log n) random key
);

create index if not exists master_games_rnd_idx on public.master_games (rnd);
create index if not exists master_games_elo_idx on public.master_games (white_elo, black_elo);

alter table public.master_games enable row level security;
drop policy if exists "master games readable" on public.master_games;
create policy "master games readable" on public.master_games for select using (true);

-- A batch of random games (optionally above an Elo floor), O(log n) via rnd.
create or replace function public.random_master_games(
  p_count int default 12,
  p_min_elo int default 0
) returns setof public.master_games
language plpgsql stable
as $$
declare
  x double precision := random();
begin
  return query
    select * from public.master_games g
    where (p_min_elo = 0 or (coalesce(g.white_elo, 0) >= p_min_elo and coalesce(g.black_elo, 0) >= p_min_elo))
      and g.rnd >= x
    order by g.rnd
    limit greatest(1, least(p_count, 50));
  if not found then
    return query
      select * from public.master_games g
      where (p_min_elo = 0 or (coalesce(g.white_elo, 0) >= p_min_elo and coalesce(g.black_elo, 0) >= p_min_elo))
      order by g.rnd
      limit greatest(1, least(p_count, 50));
  end if;
end;
$$;
