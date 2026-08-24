<div align="center">

<img src="./assets/logo.svg" width="120" alt="ChessMaster logo" />

# ♟️ ChessMaster

**Learn chess online and offline — your way to become a King.**

A B2C mobile app: live Olympiad games, an end-to-end self-learn curriculum, a
game analyzer for *your* games, and a coach that preps you for tournaments.

</div>

---

## What's in this repo (v0 scaffold)

A cross-platform mobile app built with **Expo + React Native + TypeScript**.
The design follows a clean, classic light theme (white surfaces, black actions,
gold accents, bold colorful feature cards).

**Free to use during launch** — all features unlocked; paid plans come later.

### Actually functional (real chess logic)

- ♟️ **Play vs Computer** — full legal-move play against a built-in engine
  (negamax + alpha-beta), three difficulty levels. Powered by `chess.js` for
  rules and our own `src/engine/ai.ts`.
- 🧩 **Puzzle solving** — tap the winning move; validated live. Every puzzle's
  solution is **machine-verified** by `npm run verify:puzzles`.
- 🔍 **Game analyzer** — paste a PGN and get an engine review: accuracy, ACPL,
  and every move rated (Best → Blunder). See `src/engine/analyze.ts`.
- 📚 **Curriculum** — real self-learn lessons + an **Opening Book** (ECO lines,
  verified FENs).

Open resources used: `chess.js` (BSD) for rules; the Lichess puzzle taxonomy
(themes) and `lichess/chess-openings` naming (CC0) as the model to scale the
puzzle/opening data later.

### Board & pieces
- **Cburnett** SVG piece set by Colin M.L. Burnett (via lichess-org/lila) —
  the original Wikimedia set is tri-licensed GFDL / BSD / GPLv2+ (BSD permits
  commercial use). Parsed into `react-native-svg` primitives so it renders on
  web and native.
- Board shows **file/rank coordinates**, highlights the **selected square**,
  **legal moves**, **last move**, and the **king in check** (purple).

### Play modes
- **Play vs Computer** — engine opponent, difficulty levels.
- **Play with a Friend** — two players on one device (pass & play), board
  auto-flips to the side to move. (Online multiplayer needs the backend.)

### Screens

| Area | Screens |
|---|---|
| **Onboarding** | Welcome / splash, Sign Up ("Become a Chess Member"), Sign In |
| **Class** | Live Class · Upcoming Class (language schedules) · All Class (levels + self-learn curriculum) |
| **Olympiad Live** | Live game player with board, engine eval, move list & playback controls |
| **Puzzle** | Assigned puzzles list + puzzle solver ("Your Turn") |
| **Game** | Play tournaments / friends / computer, chess clock, + Analyzer & Prep Coach |
| **Analyze** | Import from Chess.com / Lichess / PGN → findings & recurring mistakes |
| **Coach** | Tournament-prep plan & repertoire coaching |
| **Plans** | Membership tiers (preview — free during launch) |
| **Shop** | Boards, pieces, clocks, T-shirts |
| **Profile** | Rating, streak, settings |

### Project structure

```
App.tsx                     App root + navigation container
src/
  theme/           Design tokens (colors, spacing, typography)
  components/       Logo, ChessBoard, AppHeader, UI kit (Button, Card, Input…)
  data/            content.ts — placeholder content (swap for backend later)
  navigation/      RootNavigator (auth stack + bottom tabs + detail screens)
  screens/         All app screens
assets/            Logo + generated app icons / splash
PRODUCT.md         Product vision & roadmap
```

## Run it

```bash
npm install
npm start          # then press i (iOS), a (Android), or w (web)
# or:
npm run ios
npm run android
npm run web
```

Requires [Node 18+](https://nodejs.org) and the
[Expo Go](https://expo.dev/go) app on your phone (or a simulator).

```bash
npm run typecheck  # tsc --noEmit
```

## Roadmap

- **v0 (this repo):** full screen scaffold, navigation, design system, logo.
- **v1:** real accounts, live-game feed, on-device Stockfish analysis, backend.
- **v1.x:** deeper analyzer, repertoire trainer, notifications, social.

See [PRODUCT.md](./PRODUCT.md) for the full vision.

> Placeholder players, games, and prices are illustrative only.
