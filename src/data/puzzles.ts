/**
 * Tactics puzzles — topic (theme) wise.
 *
 * Every puzzle's solution is machine-verified with chess.js by
 * `scripts/verify-puzzles.js` (run `npm run verify:puzzles`): mate puzzles are
 * confirmed to be checkmate, "win" puzzles to capture an undefended piece.
 *
 * Themes follow the Lichess puzzle taxonomy so this set can later be scaled up
 * from the public-domain Lichess puzzle database (CC0).
 */

export type PuzzleDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type Puzzle = {
  id: string;
  title: string;
  theme: string;
  difficulty: PuzzleDifficulty;
  /** 'mate' = deliver checkmate; 'win' = win material; 'line' = best line (API). */
  kind: 'mate' | 'win' | 'line';
  fen: string;
  /** Solution line in SAN. Even indices = the solver's moves, odd = replies. */
  solution: string[];
};

export const puzzles: Puzzle[] = [
  { id: 'm1', title: 'Back-rank mate', theme: 'Back-rank mate', difficulty: 'Beginner', kind: 'mate', fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1', solution: ['Ra8#'] },
  { id: 'm2', title: 'Back-rank capture', theme: 'Back-rank mate', difficulty: 'Beginner', kind: 'mate', fen: '3r2k1/5ppp/8/8/8/8/7P/3R2K1 w - - 0 1', solution: ['Rxd8#'] },
  { id: 'm3', title: 'Smothered mate', theme: 'Smothered mate', difficulty: 'Intermediate', kind: 'mate', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', solution: ['Nf7#'] },
  { id: 'm4', title: 'Queen mate (d-file)', theme: 'Queen mate', difficulty: 'Beginner', kind: 'mate', fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', solution: ['Qd8#'] },
  { id: 'm5', title: 'Queen mate (e-file)', theme: 'Queen mate', difficulty: 'Beginner', kind: 'mate', fen: '6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1', solution: ['Qe8#'] },
  { id: 'm6', title: 'Rook to the 8th', theme: 'Rook mate', difficulty: 'Beginner', kind: 'mate', fen: '6k1/5ppp/8/8/8/8/8/1R5K w - - 0 1', solution: ['Rb8#'] },
  { id: 'm7', title: 'Bishop & queen', theme: 'Bishop + queen', difficulty: 'Intermediate', kind: 'mate', fen: '6k1/5ppp/8/8/8/1B6/5PPP/3Q2K1 w - - 0 1', solution: ['Qd8#'] },
  { id: 'h1', title: 'Win the rook', theme: 'Win a piece', difficulty: 'Beginner', kind: 'win', fen: '4k3/8/8/4r3/8/8/1B6/4K3 w - - 0 1', solution: ['Bxe5'] },
  { id: 'h2', title: 'Win the bishop', theme: 'Win a piece', difficulty: 'Beginner', kind: 'win', fen: '4k3/8/8/4b3/8/8/4R3/4K3 w - - 0 1', solution: ['Rxe5+'] },
  { id: 'h3', title: 'Win the queen', theme: 'Win the queen', difficulty: 'Intermediate', kind: 'win', fen: '4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', solution: ['Qxd5'] },
];

/** Distinct themes, for topic-wise browsing. */
export const puzzleThemes = Array.from(new Set(puzzles.map((p) => p.theme)));
