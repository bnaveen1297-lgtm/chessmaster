-- Seed a small, machine-verified set of themed tactics puzzles so the puzzle
-- curriculum (Puzzle Courses) has on-theme content out of the box. Every row
-- is validated by web/scripts/gen-puzzles.mjs the same way the client converts
-- it (apply setup move, replay solution; mates must end in checkmate).
-- Idempotent: safe to re-run. The full Lichess CC0 database can be layered on
-- top later (see docs/PUZZLES.md) — these seed ids are namespaced 'seed-*'.

insert into public.puzzles (id, fen, moves, rating, themes) values
  ('seed-br-b', '6k1/p4ppp/8/8/8/8/6P1/1R4K1 b - - 0 1', 'a7a6 b1b8', 900, 'backRankMate mate mateIn1 short endgame'),
  ('seed-br-c', '6k1/p4ppp/8/8/8/8/6P1/2R3K1 b - - 0 1', 'a7a6 c1c8', 901, 'backRankMate mate mateIn1 short endgame'),
  ('seed-br-d', '6k1/p4ppp/8/8/8/8/6P1/3Q2K1 b - - 0 1', 'a7a6 d1d8', 902, 'backRankMate mate mateIn1 short endgame'),
  ('seed-sm-g5', '6rk/p5pp/8/6N1/8/8/8/K7 b - - 0 1', 'a7a6 g5f7', 1400, 'smotheredMate mate mateIn1 short knight middlegame'),
  ('seed-sm-e5', '6rk/p5pp/8/4N3/8/8/8/K7 b - - 0 1', 'a7a6 e5f7', 1400, 'smotheredMate mate mateIn1 short knight middlegame'),
  ('seed-lad-1', '6k1/R7/1R6/8/8/8/8/6K1 b - - 0 1', 'g8h8 b6b8', 800, 'mate mateIn1 rookEndgame short endgame'),
  ('seed-qm-1', '6k1/3Q4/6K1/8/8/8/8/8 b - - 0 1', 'g8h8 d7h7', 1000, 'mate mateIn1 queenEndgame short endgame'),
  ('seed-qm-2', '6k1/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'g8h8 f7f8', 1000, 'mate mateIn1 queenEndgame short endgame'),
  ('seed-hp-1', '4k3/8/5n2/8/8/8/8/3RK3 b - - 0 1', 'f6d5 d1d5', 800, 'hangingPiece advantage crushing oneMove'),
  ('seed-hp-2', '4k3/5b2/8/8/8/8/8/2R1K3 b - - 0 1', 'f7c4 c1c4', 850, 'hangingPiece advantage crushing oneMove'),
  ('seed-hp-3', '4k3/8/1n6/8/8/8/8/3RK3 b - - 0 1', 'b6d5 d1d5', 800, 'hangingPiece advantage crushing oneMove'),
  ('seed-fork-1', '4q1k1/p7/8/8/4N3/8/8/6K1 b - - 0 1', 'a7a6 e4f6 g8h8 f6e8', 1300, 'fork knight advantage crushing middlegame'),
  ('seed-pin-1', '3k4/7p/8/3n4/8/8/6B1/3R2K1 b - - 0 1', 'h7h6 g2d5', 1300, 'pin advantage crushing oneMove middlegame'),
  ('seed-skewer-1', '7q/p7/8/8/3k4/8/8/2B3K1 b - - 0 1', 'a7a6 c1b2 d4e4 b2h8', 1350, 'skewer bishop advantage crushing middlegame')
on conflict (id) do update set fen=excluded.fen, moves=excluded.moves, rating=excluded.rating, themes=excluded.themes;