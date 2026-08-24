# Backend integration plan

The app is built so a backend can be plugged in **without touching the UI**.
Two seams already exist:

| Seam | File | Swap in |
|---|---|---|
| Auth | `src/auth/AuthContext.tsx` | Replace `signIn` / `signUp` bodies with API calls; store the token. |
| Content | `src/services/content.ts` + `src/services/api.ts` | Set `EXPO_PUBLIC_API_URL`; each service auto-switches from local data to `apiGet(...)`. |

## Turning on the backend

1. Copy `.env.example` → `.env` and set `EXPO_PUBLIC_API_URL=https://api.chessmaster.app`.
2. Implement the endpoints below.
3. That's it — screens read through the service layer, so no screen changes.

## Endpoints (v1)

| Method | Path | Returns |
|---|---|---|
| POST | `/auth/register` | `{ user, token }` |
| POST | `/auth/login` | `{ user, token }` |
| GET | `/olympiad/live` | `LiveGame[]` |
| GET | `/curriculum` | `CurriculumUnit[]` |
| GET | `/puzzles` | `Puzzle[]` |
| GET | `/tournaments/open` | `OpenTournament[]` |

Response shapes are the exported types in `src/data/content.ts` — keep the API
contract aligned with them.

## Recommended stack (CTO proposal)

- **Auth & data:** managed backend (Supabase / Firebase) for a fast launch —
  accounts, profiles, progress, and a Postgres/Firestore store.
- **Live Olympiad feed:** ingest a broadcast PGN source (e.g. Lichess broadcast
  API) into `/olympiad/live`; push updates over websockets later.
- **Analysis:** Stockfish — WASM on-device for quick eval, a server worker for
  deep multi-game reports.
- **Payments (later):** RevenueCat over App Store / Play billing when paid
  plans launch. Free during launch, so not on the critical path.

## Milestones

1. **CI** ✅ (typecheck + lint on every push).
2. **Accounts + persistence** — real `/auth/*`, sync rating & streak.
3. **Live feed** — wire `/olympiad/live` to a broadcast source (the launch hook).
4. **Analyzer** — PGN/Chess.com/Lichess import → engine report.
5. **Payments** — plans, when we choose to monetize.
