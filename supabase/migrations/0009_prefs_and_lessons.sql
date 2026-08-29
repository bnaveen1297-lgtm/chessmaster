-- Persist per-user onboarding preferences and lesson progress so state
-- follows the account across devices/browsers (not just localStorage).
--
-- The web client is written to tolerate these columns being absent (it falls
-- back to per-user localStorage), so applying this migration is what upgrades
-- the app from device-local to fully account-synced state.

-- Onboarding preferences (role, coach, level, board theme, piece style,
-- onboarded flag) stored as a single JSON blob on the user's profile.
alter table public.profiles
  add column if not exists prefs jsonb not null default '{}'::jsonb;

-- Completed lesson ids, so curriculum progress syncs like the rest of progress.
alter table public.progress
  add column if not exists lessons_completed text[] not null default '{}';
