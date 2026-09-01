import { Chess } from 'chess.js';
import { moveScores } from './ai';
import { openings } from '../data/openings';

/**
 * Game analyzer: replays a PGN and, for every move, compares what was played to
 * the engine's best move (centipawn loss) to classify it and build a report.
 * A lightweight, offline "review your game" feature in the spirit of Chess.com's
 * Game Review — the depth is shallow for speed on-device; a Stockfish worker can
 * later raise accuracy behind the same `analyzeGame` interface.
 *
 * Win% + accuracy follow the Lichess / Chess.com public models so the numbers
 * feel familiar; the richer move labels (Book/Brilliant/Great/Miss/…) are
 * documented heuristics — approximate, deliberately conservative for the rare
 * ones (Brilliant/Great), and never Stockfish-exact at this depth.
 */

export type MoveClass =
  | 'Book'
  | 'Brilliant'
  | 'Great'
  | 'Best'
  | 'Good'
  | 'Inaccuracy'
  | 'Miss'
  | 'Mistake'
  | 'Blunder';

export type AnalyzedMove = {
  ply: number;
  moveNo: number;
  color: 'w' | 'b';
  san: string;
  cpLoss: number;
  classification: MoveClass;
  /** Engine's best move in this position (SAN). */
  bestSan: string;
  fenAfter: string;
  /** Eval after the move, in centipawns from White's perspective (clamped). */
  cp: number;
  /** Win% for the mover if they had played the best move (0..100). */
  winPctBefore: number;
  /** Win% for the mover after the move actually played (0..100). */
  winPctAfter: number;
  /** Per-move accuracy (0..100) derived from the win% drop. */
  accuracy: number;
};

export type SideReport = {
  accuracy: number;
  acpl: number; // average centipawn loss
  // Original five counts (kept for back-compat).
  best: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  // New richer counts (additive).
  book: number;
  brilliant: number;
  great: number;
  miss: number;
};

export type GameReport = {
  moves: AnalyzedMove[];
  white: SideReport;
  black: SideReport;
  result: string;
  /** Best-matching opening name, or 'Unknown opening'. */
  openingName: string;
  /** White win% after each ply — a series for the evaluation graph. */
  evalSeries: number[];
};

export const PIECE_CP: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900 };
/** A "minor piece" worth of material — the sacrifice threshold for Brilliant. */
export const MINOR = 300;

/**
 * Lichess/Chess.com win-probability model. `cp` is from the mover's
 * perspective (positive = better for the mover). Returns 0..100.
 */
export function winPct(cp: number): number {
  const v = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  return Math.max(0, Math.min(100, v));
}

/**
 * Chess.com-like per-move accuracy from the win% the mover gave up.
 * A best move (no drop) → ~100; large drops fall off toward 0.
 */
export function moveAccuracy(winBefore: number, winAfter: number): number {
  const drop = Math.max(0, winBefore - winAfter);
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

/** Base classification by centipawn loss (the thresholds used previously). */
function baseClass(cp: number): 'Best' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' {
  if (cp < 20) return 'Best';
  if (cp < 50) return 'Good';
  if (cp < 100) return 'Inaccuracy';
  if (cp < 250) return 'Mistake';
  return 'Blunder';
}

/** Material balance (centipawns) from `color`'s point of view, kings excluded. */
export function materialBalance(game: Chess, color: 'w' | 'b'): number {
  const board = game.board();
  let bal = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const v = PIECE_CP[piece.type];
      if (!v) continue; // king
      bal += piece.color === color ? v : -v;
    }
  }
  return bal;
}

function emptySide(): SideReport & { _sum: number; _n: number; _accSum: number } {
  return {
    accuracy: 0, acpl: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0,
    book: 0, brilliant: 0, great: 0, miss: 0, _sum: 0, _n: 0, _accSum: 0,
  };
}

/** Parse and validate a PGN; throws on invalid input. */
export function parsePgn(pgn: string): { san: string; color: 'w' | 'b' }[] {
  const game = new Chess();
  game.loadPgn(pgn); // throws if invalid
  const history = game.history({ verbose: true });
  if (history.length === 0) throw new Error('No moves found in this PGN.');
  return history.map((m) => ({ san: m.san, color: m.color as 'w' | 'b' }));
}

/**
 * How many leading plies of the game are still "book": the length of the
 * longest known opening line that is a prefix of the game. Also returns the
 * name of that best (longest) match.
 */
export function detectOpening(sans: string[]): { name: string; bookPlies: number } {
  let bookPlies = 0;
  let name = 'Unknown opening';
  for (const op of openings) {
    const len = op.moves.length;
    if (len > sans.length) continue;
    let isPrefix = true;
    for (let i = 0; i < len; i++) {
      if (op.moves[i] !== sans[i]) { isPrefix = false; break; }
    }
    if (isPrefix && len > bookPlies) {
      bookPlies = len;
      name = op.name;
    }
  }
  return { name, bookPlies };
}

export function analyzeGame(pgn: string, depth = 2): GameReport {
  const moves = parsePgn(pgn);
  const sans = moves.map((m) => m.san);
  const { name: openingName, bookPlies } = detectOpening(sans);

  const replay = new Chess();
  const analyzed: AnalyzedMove[] = [];
  const evalSeries: number[] = [];
  const white = emptySide();
  const black = emptySide();

  for (let i = 0; i < moves.length; i++) {
    const { san, color } = moves[i];
    const fenBefore = replay.fen();

    // Score every legal move from the mover's perspective.
    const scores = moveScores(fenBefore, depth);
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const best = sorted.length ? sorted[0].score : 0;
    const bestSan = sorted.length ? sorted[0].san : san;
    const secondBest = sorted.length > 1 ? sorted[1].score : best;
    const played = scores.find((s) => s.san === san);
    const playedScore = played ? played.score : best;
    let cpLoss = Math.max(0, best - playedScore);
    if (cpLoss > 1000) cpLoss = 1000; // clamp mate-sized swings

    // Material before the move, from the mover's point of view.
    const matBefore = materialBalance(replay, color);

    replay.move(san);

    // Eval from White's perspective (for the graph and the move's cp field).
    const cpWhite = color === 'w' ? playedScore : -playedScore;
    const cpWhiteClamped = Math.max(-10000, Math.min(10000, Math.round(cpWhite)));

    // Win% for the mover: before = had they played best; after = what they did.
    const winPctBefore = winPct(best);
    const winPctAfter = winPct(playedScore);
    const isBook = i < bookPlies;
    const acc = isBook ? 100 : moveAccuracy(winPctBefore, winPctAfter);

    // Sacrifice detection: after the move it is the opponent to move. Take their
    // greediest single capture; if even then the mover is left >= a minor piece
    // down versus before the move, the mover invested material.
    let curBal = materialBalance(replay, color);
    let worstBal = curBal;
    for (const m of replay.moves({ verbose: true })) {
      if (m.captured) {
        const after = curBal - (PIECE_CP[m.captured] ?? 0);
        if (after < worstBal) worstBal = after;
      }
    }
    const isSacrifice = worstBal <= matBefore - MINOR;

    const cls = classifyMove({
      isBook,
      cpLoss,
      winBefore: winPctBefore,
      winAfter: winPctAfter,
      secondBestGap: best - secondBest,
      isSacrifice,
    });

    analyzed.push({
      ply: i + 1,
      moveNo: Math.floor(i / 2) + 1,
      color,
      san,
      cpLoss,
      classification: cls,
      bestSan,
      fenAfter: replay.fen(),
      cp: cpWhiteClamped,
      winPctBefore: Math.round(winPctBefore),
      winPctAfter: Math.round(winPctAfter),
      accuracy: Math.round(acc),
    });
    evalSeries.push(Math.round(winPct(cpWhite)));

    const side = color === 'w' ? white : black;
    side._sum += cpLoss;
    side._n += 1;
    side._accSum += acc;
    if (cls === 'Book') side.book++;
    else if (cls === 'Brilliant') side.brilliant++;
    else if (cls === 'Great') side.great++;
    else if (cls === 'Best') side.best++;
    else if (cls === 'Good') side.good++;
    else if (cls === 'Inaccuracy') side.inaccuracy++;
    else if (cls === 'Miss') side.miss++;
    else if (cls === 'Mistake') side.mistake++;
    else side.blunder++;
  }

  const finalize = (s: ReturnType<typeof emptySide>): SideReport => {
    const acpl = s._n ? Math.round(s._sum / s._n) : 0;
    // Overall accuracy = mean of the side's per-move accuracy (Chess.com-like).
    const accuracy = s._n ? Math.max(0, Math.min(100, Math.round(s._accSum / s._n))) : 0;
    return {
      accuracy, acpl, best: s.best, good: s.good, inaccuracy: s.inaccuracy,
      mistake: s.mistake, blunder: s.blunder, book: s.book, brilliant: s.brilliant,
      great: s.great, miss: s.miss,
    };
  };

  let result = '*';
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    result = (g.header().Result as string) || (g.isCheckmate() ? (g.turn() === 'w' ? '0-1' : '1-0') : '*');
  } catch {
    // keep '*'
  }

  return {
    moves: analyzed,
    white: finalize(white),
    black: finalize(black),
    result,
    openingName,
    evalSeries,
  };
}

/**
 * Turn the move's context into a rich label. Precedence, high → low:
 *  - Book:      still inside a known opening line (never counted as a mistake).
 *  - Miss:      a clearly winning move was available (best keeps win% >= 75 for
 *               the mover) but the played move drops below 55 — a missed win.
 *               Outranks Mistake/Blunder.
 *  - Brilliant: a Best move that sacrifices >= a minor piece of material (on
 *               this or the next ply, per the engine line) yet still keeps the
 *               mover at >= 50 win% — rare by design.
 *  - Great:     a Best move that is essentially the only good one (second-best
 *               is >= ~150cp worse).
 *  - Best/Good/Inaccuracy/Mistake/Blunder: by centipawn-loss thresholds.
 */
export function classifyMove(ctx: {
  isBook: boolean;
  cpLoss: number;
  winBefore: number;
  winAfter: number;
  secondBestGap: number;
  isSacrifice: boolean;
}): MoveClass {
  if (ctx.isBook) return 'Book';
  const base = baseClass(ctx.cpLoss);
  // Missed win outranks the plain mistake/blunder labels.
  if (base !== 'Best' && ctx.winBefore >= 75 && ctx.winAfter < 55) return 'Miss';
  if (base === 'Best') {
    if (ctx.isSacrifice && ctx.winAfter >= 50) return 'Brilliant';
    if (ctx.secondBestGap >= 150) return 'Great';
    return 'Best';
  }
  return base;
}

export const SAMPLE_PGN =
  '[Event "Scholar\'s Mate demo"]\n[White "You"]\n[Black "Opponent"]\n[Result "1-0"]\n\n1. e4 e5 2. Bc4 Bc5 3. Qh5 Nf6 4. Qxf7# 1-0';
