-- Swiss format + per-tournament time control.
alter table public.tournaments add column if not exists time_control text not null default 'unlimited';
alter table public.tournaments drop constraint if exists tournaments_format_check;
alter table public.tournaments add constraint tournaments_format_check
  check (format = any (array['roundrobin'::text, 'knockout'::text, 'swiss'::text]));
