import { Chess } from 'chess.js';
import type { Puzzle, PuzzleDifficulty } from '../data/puzzles';

/**
 * Adapters for the Lichess puzzle database (CC0, ~5M puzzles) and the Lichess
 * daily-puzzle API. These are pure (no network / no Supabase import) so they can
 * be unit-tested — see scripts/test-puzzledb.js.
 *
 * Lichess CSV columns:
 *   PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays,
 *   Themes, GameUrl, OpeningTags
 * Convention: `FEN` is the position BEFORE the opponent's setup move; the first
 * move in `Moves` is that setup move, and the solver plays from the second move
 * on (alternating solver / opponent).
 */

export type LichessRow = {
  id: string;
  fen: string;
  moves: string; // space-separated UCI
  rating: number;
  themes: string; // space-separated
  gameUrl?: string;
};

/** Parse one CSV line of the Lichess puzzle DB (no field contains a comma). */
export function parseCsvLine(line: string): LichessRow | null {
  const c = line.split(',');
  if (c.length < 8) return null;
  const rating = parseInt(c[3], 10);
  if (!c[0] || !c[1] || !c[2] || Number.isNaN(rating)) return null;
  return { id: c[0], fen: c[1], moves: c[2], rating, themes: c[7] || '', gameUrl: c[8] };
}

function difficultyFor(rating: number): PuzzleDifficulty {
  if (rating < 1400) return 'Beginner';
  if (rating < 1900) return 'Intermediate';
  return 'Advanced';
}

function titleFromThemes(themes: string[]): string {
  // Pick the most human theme, prettified.
  const skip = new Set(['short', 'long', 'oneMove', 'veryLong', 'middlegame', 'endgame', 'opening', 'master', 'crushing', 'advantage', 'equality']);
  const pick = themes.find((t) => !skip.has(t)) || themes[0] || 'Tactics';
  return pick.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function applyUci(game: Chess, uci: string) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  try {
    return game.move({ from, to, promotion: (promotion as any) || undefined });
  } catch {
    return null; // chess.js throws on illegal moves in v1
  }
}

/**
 * Convert a Lichess CSV row into a chesshub360 Puzzle: apply the setup move,
 * then translate the remaining UCI solution into SAN. Returns null if the row
 * doesn't produce a legal line.
 */
export function rowToPuzzle(row: LichessRow): Puzzle | null {
  const uci = row.moves.trim().split(/\s+/);
  if (uci.length < 2) return null;
  const game = new Chess();
  try {
    game.load(row.fen);
  } catch {
    return null;
  }
  // First move sets up the puzzle (opponent), then the solver is to move.
  if (!applyUci(game, uci[0])) return null;
  const puzzleFen = game.fen();
  const solution: string[] = [];
  for (let i = 1; i < uci.length; i++) {
    const mv = applyUci(game, uci[i]);
    if (!mv) return null;
    solution.push(mv.san);
  }
  if (solution.length === 0) return null;

  const themes = row.themes.trim() ? row.themes.trim().split(/\s+/) : [];
  const isMate = themes.some((t) => t.startsWith('mate'));
  return {
    id: `lichess-${row.id}`,
    title: titleFromThemes(themes),
    theme: titleFromThemes(themes),
    difficulty: difficultyFor(row.rating),
    kind: isMate ? 'mate' : 'line',
    fen: puzzleFen,
    solution,
  };
}

/**
 * Build a Puzzle from the Lichess daily-puzzle API payload. The game PGN is
 * replayed to `initialPly`, and `solutionUci` are the solver's moves from there.
 */
export function dailyToPuzzle(input: {
  id: string;
  pgn: string;
  initialPly: number;
  solutionUci: string[];
  rating?: number;
  themes?: string[];
}): Puzzle | null {
  const game = new Chess();
  const sans = (() => {
    const g = new Chess();
    try {
      g.loadPgn(input.pgn);
    } catch {
      return null;
    }
    return g.history();
  })();
  if (!sans) return null;
  for (let i = 0; i < Math.min(input.initialPly, sans.length); i++) {
    if (!game.move(sans[i])) return null;
  }
  const puzzleFen = game.fen();
  const solution: string[] = [];
  for (const uci of input.solutionUci) {
    const mv = applyUci(game, uci);
    if (!mv) return null;
    solution.push(mv.san);
  }
  if (solution.length === 0) return null;
  const themes = input.themes ?? [];
  return {
    id: `daily-${input.id}`,
    title: 'Daily Puzzle',
    theme: themes.length ? titleFromThemes(themes) : 'Daily Puzzle',
    difficulty: difficultyFor(input.rating ?? 1500),
    kind: themes.some((t) => t.startsWith('mate')) ? 'mate' : 'line',
    fen: puzzleFen,
    solution,
  };
}
