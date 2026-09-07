-- Online rating (Elo) for rated, timed games. Client updates its own row (the
-- "own profile" RLS policy already allows auth.uid() = id); ratings are readable
-- by any authenticated user so opponents can be shown with their rating.
alter table public.profiles add column if not exists rating integer not null default 1200;
alter table public.profiles add column if not exists rated_games integer not null default 0;
