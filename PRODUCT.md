# ♟️ ChessMaster — Product Vision

> **Learn chess, prepare like a champion, and play the world.**
> A B2C mobile app launching around the Chess Olympiad — **free to use during launch.**

---

## 1. The one-line pitch

ChessMaster is a mobile-first chess academy in your pocket: a complete
self-learn curriculum, an AI coach that analyzes *your* games (imported from
Chess.com / Lichess or uploaded as PGN), live Olympiad games with expert
commentary, and a place to play tournaments — **free to use during launch**.

## 2. Why now — the Olympiad launch wedge

The Chess Olympiad is a global attention spike. Millions who *watch* chess
don't yet have a simple, guided way to *get better*. ChessMaster rides that
wave:

- **Free during launch** removes all friction during peak hype — just install
  and start.
- **Live Olympiad games** are the acquisition hook — come to watch, stay to learn.
- **"Prepare for tournaments" coaching** speaks to the aspirational player the
  Olympiad inspires.

The launch goal is **acquisition and habit**: convert curiosity into an
installed, logged-in user who comes back daily. Monetization comes later.

## 3. Target users

| Persona | Need | ChessMaster answer |
|---|---|---|
| **The Inspired Beginner** | "The Olympiad looks amazing, how do I start?" | End-to-end self-learn curriculum |
| **The Plateaued Club Player** | "I'm stuck at my rating." | AI analysis of their own games + targeted coaching |
| **The Aspiring Competitor** | "I have a tournament next month." | Engine that builds a prep plan & opening repertoire |
| **The Fan** | "I just want to watch and enjoy." | Live Olympiad games + open tournaments |

## 4. The five pillars (core features)

### 🔴 1. Olympiad Live
Live games with move-by-move engine evaluation, a beginner-friendly commentary
layer, and "what would you play?" prediction prompts that quietly teach while
you watch.

### 📚 2. End-to-End Curriculum (self-learn)
A structured path from *"how the pieces move"* to *"advanced endgames"*.
Bite-sized lessons, interactive puzzles, spaced-repetition review, and mastery
checkpoints. Progress is tracked so the app always knows the next best lesson.

### 🔍 3. Your-Games Analyzer
Import games from **Chess.com** or **Lichess** (by username) or upload a **PGN**.
The analyzer surfaces blunders, missed tactics, recurring mistakes, and turns
them into personalized practice — *"you hang your bishop in the opening 40% of
the time; here are 5 drills."*

### 🧠 4. Tournament-Prep Coach (the engine)
More than an engine that says the best move — a coach that builds a **prep
plan**: opening repertoire suggestions, opponent-style scouting, a training
schedule leading up to an event, and post-round review.

### 🏆 5. Play & Compete
The normal, expected stuff done well: play vs. bots or people, open tournaments,
daily puzzles, and a rating that follows you across everything.

## 5. Monetization (revisit later)

**For launch, ChessMaster is free to use** — every feature unlocked, no paywall.
The goal right now is acquisition and habit: get inspired Olympiad watchers
installed, logged in, and coming back daily. Pricing is a later decision.

Directions we may explore once we have an engaged base:

- **ChessMaster membership** (subscription) → deep analysis, full curriculum,
  advanced coach.
- **Coach add-ons** → deeper opponent scouting, unlimited repertoire building.
- **Shop** → boards, clocks, pieces, apparel.

A membership-tiers screen exists in the app as a *preview* only; today it says
"included free."

## 6. MVP scope (what ships for the Olympiad)

1. Onboarding + auth (Join / Sign in) — free, no paywall
2. Class: Live / Upcoming (language schedules) / All + self-learn curriculum
3. Olympiad Live viewer (board + eval + move list + playback)
4. Puzzles: assigned list + solver
5. Analyzer: PGN upload + Chess.com/Lichess import → annotated review
6. Coach: generate a simple tournament-prep plan
7. Game: vs-bot / friends / tournaments + chess clock
8. Shop + Profile (rating, streak, settings)

## 7. Tech direction

- **Expo + React Native + TypeScript** — one codebase → iOS + Android, fast
  iteration, over-the-air updates for rapid launch-window fixes.
- **React Navigation** (bottom tabs + stacks).
- Chess logic via `chess.js`; board rendering custom / `react-native-svg`.
- Analysis powered by a chess engine (Stockfish) — on-device (WASM/native) for
  quick eval, server-side for deep multi-game analysis.
- Backend (later): accounts, payments (RevenueCat/Stripe), live-game feed,
  cloud analysis, tournaments.

See [`README.md`](./README.md) for how to run the scaffold in this repo.

## 8. Roadmap

- **v0 (this repo):** app scaffold — navigation, screens, design system, logo.
- **v1 (Olympiad launch):** MVP scope above, free to use.
- **v1.x:** deeper analyzer, repertoire trainer, social/friends, notifications.
- **v2:** live coaching marketplace, team/club features, streaming integrations.
