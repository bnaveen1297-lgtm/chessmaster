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

/**
 * A one-line teaching note per theme, shown after a puzzle is solved so the
 * pattern sticks. Falls back to a generic tip for unknown (e.g. imported)
 * themes. Theme names follow the Lichess taxonomy.
 */
const THEME_TIPS: Record<string, string> = {
  'Back-rank mate': 'A king trapped behind its own pawns is mated on the back rank — always check yours has luft (an escape square).',
  'Smothered mate': 'When the king is boxed in by its own pieces, a knight can deliver mate that nothing can block or capture.',
  'Queen mate': 'The queen mates by controlling the king’s escape squares while a friendly piece or edge covers the rest.',
  'Rook mate': 'A rook mates on a back rank or edge once the enemy king has no flight squares off that line.',
  'Bishop + queen': 'Bishop and queen combine on a diagonal to trap the king — the bishop guards flight squares the queen can’t.',
  'Win a piece': 'Look for undefended (“hanging”) pieces and pieces you can attack more times than they’re defended.',
  'Win the queen': 'The most valuable piece is the biggest target — forks, pins and skewers win it outright.',
  Fork: 'One piece attacking two targets at once — the opponent can only save one.',
  Pin: 'A piece can’t move without exposing a more valuable one behind it. Pile up on the pinned piece.',
  Skewer: 'A pin in reverse: the valuable piece is in front and must move, losing what’s behind it.',
};

export function themeTip(theme: string): string {
  return THEME_TIPS[theme] ?? 'Spot the forcing move — checks, captures and threats first.';
}
