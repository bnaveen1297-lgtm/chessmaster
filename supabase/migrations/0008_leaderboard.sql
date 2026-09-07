-- Public leaderboard: a privacy-safe projection of the progress table.
-- `progress` RLS lets a user read only their own row, so a leaderboard needs a
-- SECURITY DEFINER function that returns a limited public shape (display name +
-- XP + streak only — never email) for the top players.

create or replace function public.public_leaderboard(p_limit int default 25)
returns table (name text, xp int, streak_days int)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(pr.first_name, ''), 'Player') as name, p.xp, p.streak_days
  from public.progress p
  left join public.profiles pr on pr.id = p.user_id
  order by p.xp desc, p.updated_at asc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.public_leaderboard(int) to anon, authenticated;
