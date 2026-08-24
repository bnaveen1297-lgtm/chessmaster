import { Chess, type Move } from 'chess.js';

/**
 * A small, self-contained chess engine: negamax with alpha-beta pruning,
 * material + piece-square-table evaluation. Pure TypeScript, runs offline on
 * device and web. Strength scales with search depth (see LEVELS).
 *
 * Not Stockfish-strong — deliberately. It plays legal, sensible chess for
 * learners and is a clean, license-free baseline we can later swap for a
 * Stockfish WASM worker behind the same `bestMove` interface.
 */

const PIECE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables (white's perspective, a8..h1 reading order).
// prettier-ignore
const PST: Record<string, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
   -20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20,
  ],
};

/** Static evaluation from White's perspective (centipawns). */
function evaluate(game: Chess): number {
  const board = game.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const idx = r * 8 + c;
      const base = PIECE_VALUE[piece.type];
      const pst = PST[piece.type];
      if (piece.color === 'w') {
        score += base + pst[idx];
      } else {
        // Mirror the table for black.
        const mirrored = (7 - r) * 8 + c;
        score -= base + pst[mirrored];
      }
    }
  }
  return score;
}

/** Order moves so captures/promotions are searched first (better pruning). */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMove(b) - scoreMove(a));
}
function scoreMove(m: Move): number {
  let s = 0;
  if (m.captured) s += 10 * PIECE_VALUE[m.captured] - PIECE_VALUE[m.piece];
  if (m.promotion) s += PIECE_VALUE[m.promotion];
  return s;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number, color: 1 | -1): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) return -1_000_000 + (5 - depth); // prefer faster mates
    if (game.isDraw() || game.isStalemate()) return 0;
    return color * evaluate(game);
  }
  let best = -Infinity;
  const moves = orderMoves(game.moves({ verbose: true }) as Move[]);
  for (const move of moves) {
    game.move(move);
    const score = -negamax(game, depth - 1, -beta, -alpha, (color * -1) as 1 | -1);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // cutoff
  }
  return best;
}

/**
 * Choose the engine's move for the given position.
 * Returns the chosen move in SAN, or null if the game is over.
 */
export function bestMove(fen: string, depth: number): string | null {
  const game = new Chess(fen);
  if (game.isGameOver()) return null;
  const color: 1 | -1 = game.turn() === 'w' ? 1 : -1;
  const moves = orderMoves(game.moves({ verbose: true }) as Move[]);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let chosen = moves[0];
  for (const move of moves) {
    game.move(move);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, (color * -1) as 1 | -1);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      chosen = move;
    }
  }
  return chosen.san;
}

/**
 * Score every legal move in a position, from the moving side's perspective
 * (centipawns; mates are ±~1,000,000). Used by the game analyzer to measure how
 * much a played move lost versus the engine's best.
 */
export function moveScores(fen: string, depth: number): { san: string; score: number }[] {
  const game = new Chess(fen);
  const color: 1 | -1 = game.turn() === 'w' ? 1 : -1;
  const out: { san: string; score: number }[] = [];
  for (const move of game.moves({ verbose: true }) as Move[]) {
    game.move(move);
    const score = -negamax(game, depth - 1, -Infinity, Infinity, (color * -1) as 1 | -1);
    game.undo();
    out.push({ san: move.san, score });
  }
  return out;
}

export type Level = { id: string; label: string; depth: number };

export const LEVELS: Level[] = [
  { id: 'easy', label: 'Easy', depth: 1 },
  { id: 'medium', label: 'Medium', depth: 2 },
  { id: 'hard', label: 'Hard', depth: 3 },
];
