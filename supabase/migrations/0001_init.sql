-- ChessMaster initial schema
-- Tables: profiles, progress, puzzle_attempts, games. Row-Level Security on;
-- every row is owned by the authenticated user. A signup trigger seeds a
-- profile + progress row.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  first_name  text,
  created_at  timestamptz not null default now()
);

-- ---------- progress (gamification) ----------
create table if not exists public.progress (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  xp               integer not null default 0,
  streak_days      integer not null default 0,
  last_active_date date,
  puzzles_solved   integer not null default 0,
  games_played     integer not null default 0,
  games_won        integer not null default 0,
  daily_goal       integer not null default 3,
  solved_today     integer not null default 0,
  goal_date        date,
  achievements     text[]  not null default '{}',
  updated_at       timestamptz not null default now()
);

-- ---------- puzzle_attempts ----------
create table if not exists public.puzzle_attempts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  puzzle_id  text not null,
  solved     boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- games ----------
create table if not exists public.games (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  mode       text not null,             -- 'computer' | 'friend' | 'online'
  result     text,                      -- '1-0' | '0-1' | '1/2-1/2'
  pgn        text,
  created_at timestamptz not null default now()
);

-- ---------- Row-Level Security ----------
alter table public.profiles        enable row level security;
alter table public.progress        enable row level security;
alter table public.puzzle_attempts enable row level security;
alter table public.games           enable row level security;

create policy "own profile"  on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own progress" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own attempts" on public.puzzle_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own games"    on public.games
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Seed profile + progress on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, new.raw_user_meta_data ->> 'first_name')
  on conflict (id) do nothing;

  insert into public.progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
