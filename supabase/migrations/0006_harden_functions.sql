-- Security hardening (from the Supabase database linter):
--  • pin an explicit search_path on the random-selection RPCs, and
--  • stop the signup-trigger function from being callable directly via the API.
-- Behaviour is unchanged: the on_auth_user_created trigger still fires (it runs
-- as the function owner); this only removes the exposed /rpc/handle_new_user path.

alter function public.random_puzzle(int, int, text) set search_path = public;
alter function public.random_master_games(int, int) set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
