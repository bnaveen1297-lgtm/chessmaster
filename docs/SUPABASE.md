# Supabase backend — setup

The app works **fully offline** with device-local accounts and progress. Adding
Supabase turns on **real accounts** and **cloud-synced progress** (and is the
foundation for online multiplayer). Nothing in the UI changes — it all flows
through `AuthContext` and `ProgressContext`, which switch to the backend
automatically once the env vars below are present.

## 1. Create a project
1. Sign up at [supabase.com](https://supabase.com) and create a new project
   (the free tier is plenty to start).
2. Wait for it to provision.

## 2. Apply the schema
In the Supabase dashboard → **SQL Editor**, paste and run
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).
It creates `profiles`, `progress`, `puzzle_attempts`, and `games`, enables
Row-Level Security (each user sees only their own rows), and seeds a profile +
progress row on signup.

(With the Supabase CLI you can instead run `supabase db push`.)

## 3. Wire the app
Copy `.env.example` → `.env` and fill in from **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon/public key>
```

Restart the dev server. That's it — sign-up/sign-in now create real accounts,
and XP / streak / stats sync to the cloud and follow the user across devices.

## 4. Auth settings
- **Email/password** is on by default. For quick testing you can turn off email
  confirmation (Authentication → Providers → Email → "Confirm email" off).
- Add Google / Apple providers later for one-tap sign-in.

## What's wired now
| Area | Behaviour with Supabase configured |
|---|---|
| Sign up / in / out | Real Supabase Auth; validation errors shown in the UI |
| Progress (XP, streak, stats, achievements) | Loaded from and saved to the `progress` table |

## Next (backend roadmap)
- **Online multiplayer** — Supabase **Realtime**: a `matches` table + realtime
  channel to sync moves between two devices.
- **Game & puzzle history** — write to `games` / `puzzle_attempts` (tables ready).
- **Leaderboards** — a view over `progress` ordered by XP.
- **Analysis import** — an Edge Function to pull a user's Chess.com / Lichess
  games server-side.
