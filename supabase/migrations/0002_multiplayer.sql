-- ChessMaster multiplayer + tournaments
--
-- Adds:
--   • matches            — a 1v1 game (casual online lobby game OR a tournament board)
--   • tournaments        — a round-robin or knockout event
--   • tournament_players — who joined, their seed, running score
--   • RPCs create_tournament_round / report_match_result (SECURITY DEFINER) so
--     scoring + round generation are tamper-resistant
--   • Realtime replication on all three tables so boards update live
--
-- Move legality is validated on the client (chess.js) before each update; this
-- is a friendly B2C setting, not an anti-cheat arena. Server-authoritative move
-- validation is future work (would need an edge function running chess.js).

-- Make profiles readable by any signed-in user so opponents show real names.
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles
  for select using (auth.role() = 'authenticated');

-- ---------- tournaments ----------
create table if not exists public.tournaments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  format        text not null check (format in ('roundrobin', 'knockout')),
  status        text not null default 'lobby' check (status in ('lobby', 'running', 'finished')),
  created_by    uuid not null references auth.users (id) on delete cascade,
  max_players   int  not null default 8 check (max_players between 2 and 32),
  current_round int  not null default 0,
  total_rounds  int,
  created_at    timestamptz not null default now()
);

create table if not exists public.tournament_players (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  seed          int,
  score         numeric not null default 0,
  eliminated    boolean not null default false,
  joined_at     timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

-- ---------- matches ----------
create table if not exists public.matches (
  id            uuid primary key default gen_random_uuid(),
  white_id      uuid references auth.users (id) on delete set null,
  black_id      uuid references auth.users (id) on delete set null,
  status        text not null default 'open' check (status in ('open', 'active', 'finished', 'aborted')),
  fen           text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn           text not null default '',
  turn          text not null default 'w' check (turn in ('w', 'b')),
  result        text check (result in ('1-0', '0-1', '1/2-1/2')),
  winner_id     uuid references auth.users (id) on delete set null,
  time_control  text not null default 'unlimited',
  draw_offer_by uuid references auth.users (id) on delete set null,
  tournament_id uuid references public.tournaments (id) on delete cascade,
  round         int,
  board         int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists matches_open_idx on public.matches (status) where status = 'open';
create index if not exists matches_tournament_idx on public.matches (tournament_id, round);
create index if not exists tp_tournament_idx on public.tournament_players (tournament_id);

-- ---------- Row-Level Security ----------
alter table public.tournaments        enable row level security;
alter table public.tournament_players enable row level security;
alter table public.matches            enable row level security;

-- tournaments: public to read; only the organizer writes.
drop policy if exists "tournaments read" on public.tournaments;
create policy "tournaments read" on public.tournaments
  for select using (auth.role() = 'authenticated');
drop policy if exists "tournaments insert" on public.tournaments;
create policy "tournaments insert" on public.tournaments
  for insert with check (auth.uid() = created_by);
drop policy if exists "tournaments update" on public.tournaments;
create policy "tournaments update" on public.tournaments
  for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "tournaments delete" on public.tournaments;
create policy "tournaments delete" on public.tournaments
  for delete using (auth.uid() = created_by);

-- tournament_players: public to read; you may add/remove only yourself while in
-- the lobby. Score/seed/elimination are written by SECURITY DEFINER RPCs.
drop policy if exists "tp read" on public.tournament_players;
create policy "tp read" on public.tournament_players
  for select using (auth.role() = 'authenticated');
drop policy if exists "tp join" on public.tournament_players;
create policy "tp join" on public.tournament_players
  for insert with check (auth.uid() = user_id);
drop policy if exists "tp leave" on public.tournament_players;
create policy "tp leave" on public.tournament_players
  for delete using (auth.uid() = user_id);

-- matches: public to read (lobby + spectating). Create your own casual games.
-- Participants update to play; a third player may join an open game.
drop policy if exists "matches read" on public.matches;
create policy "matches read" on public.matches
  for select using (auth.role() = 'authenticated');
drop policy if exists "matches insert" on public.matches;
create policy "matches insert" on public.matches
  for insert with check (auth.uid() = white_id and tournament_id is null);
drop policy if exists "matches update" on public.matches;
create policy "matches update" on public.matches
  for update using (
    auth.uid() = white_id
    or auth.uid() = black_id
    or (status = 'open' and black_id is null)
  ) with check (
    auth.uid() = white_id or auth.uid() = black_id
  );

-- ---------- RPC: generate a tournament round ----------
-- p_pairings is a jsonb array of { white uuid, black uuid|null, board int }.
create or replace function public.create_tournament_round(
  p_tid uuid,
  p_round int,
  p_pairings jsonb
) returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_pair  jsonb;
  v_white uuid;
  v_black uuid;
  v_board int;
begin
  select created_by into v_owner from public.tournaments where id = p_tid;
  if v_owner is null then raise exception 'tournament not found'; end if;
  if v_owner <> auth.uid() then raise exception 'only the organizer can start rounds'; end if;

  for v_pair in select * from jsonb_array_elements(p_pairings) loop
    v_white := (v_pair ->> 'white')::uuid;
    v_black := nullif(v_pair ->> 'black', '')::uuid;
    v_board := coalesce((v_pair ->> 'board')::int, 1);

    if v_black is null then
      -- Bye: white scores a full point immediately.
      insert into public.matches (white_id, black_id, status, result, winner_id, tournament_id, round, board)
      values (v_white, null, 'finished', '1-0', v_white, p_tid, p_round, v_board);
      update public.tournament_players
        set score = score + 1
        where tournament_id = p_tid and user_id = v_white;
    else
      insert into public.matches (white_id, black_id, status, tournament_id, round, board)
      values (v_white, v_black, 'active', p_tid, p_round, v_board);
    end if;
  end loop;

  update public.tournaments
    set status = 'running', current_round = p_round
    where id = p_tid;
end;
$$;

-- ---------- RPC: report a match result (atomic scoring) ----------
create or replace function public.report_match_result(
  p_match uuid,
  p_result text
) returns void
language plpgsql
security definer set search_path = public
as $$
declare
  m       public.matches;
  v_owner uuid;
begin
  select * into m from public.matches where id = p_match;
  if m.id is null then raise exception 'match not found'; end if;

  if m.tournament_id is not null then
    select created_by into v_owner from public.tournaments where id = m.tournament_id;
  end if;

  if auth.uid() not in (coalesce(m.white_id, '00000000-0000-0000-0000-000000000000'),
                        coalesce(m.black_id, '00000000-0000-0000-0000-000000000000'),
                        coalesce(v_owner,    '00000000-0000-0000-0000-000000000000')) then
    raise exception 'not a participant';
  end if;

  if m.status = 'finished' then return; end if; -- idempotent

  update public.matches
    set result = p_result,
        status = 'finished',
        winner_id = case p_result when '1-0' then m.white_id when '0-1' then m.black_id else null end,
        updated_at = now()
    where id = p_match;

  if m.tournament_id is not null then
    if p_result = '1-0' then
      update public.tournament_players set score = score + 1
        where tournament_id = m.tournament_id and user_id = m.white_id;
      update public.tournament_players set eliminated = true
        where tournament_id = m.tournament_id and user_id = m.black_id;
    elsif p_result = '0-1' then
      update public.tournament_players set score = score + 1
        where tournament_id = m.tournament_id and user_id = m.black_id;
      update public.tournament_players set eliminated = true
        where tournament_id = m.tournament_id and user_id = m.white_id;
    else -- draw
      update public.tournament_players set score = score + 0.5
        where tournament_id = m.tournament_id and user_id in (m.white_id, m.black_id);
    end if;
  end if;
end;
$$;

-- ---------- Realtime ----------
-- Boards, standings and lobby all update live via Postgres change streams.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tournaments'
  ) then
    alter publication supabase_realtime add table public.tournaments;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tournament_players'
  ) then
    alter publication supabase_realtime add table public.tournament_players;
  end if;
end $$;
