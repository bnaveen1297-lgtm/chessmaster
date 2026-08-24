import { Chess } from 'chess.js';
import { moveScores } from './ai';

/**
 * Game analyzer: replays a PGN and, for every move, compares what was played to
 * the engine's best move (centipawn loss) to classify it and build a report.
 * A lightweight, offline "review your game" feature — the depth is shallow for
 * speed on-device; a Stockfish worker can later raise accuracy behind the same
 * `analyzeGame` interface.
 */

export type MoveClass = 'Best' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';

export type AnalyzedMove = {
  ply: number;
  moveNo: number;
  color: 'w' | 'b';
  san: string;
  cpLoss: number;
  classification: MoveClass;
  fenAfter: string;
};

export type SideReport = {
  accuracy: number;
  acpl: number; // average centipawn loss
  best: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
};

export type GameReport = {
  moves: AnalyzedMove[];
  white: SideReport;
  black: SideReport;
  result: string;
};

function classify(cp: number): MoveClass {
  if (cp < 20) return 'Best';
  if (cp < 50) return 'Good';
  if (cp < 100) return 'Inaccuracy';
  if (cp < 250) return 'Mistake';
  return 'Blunder';
}

function emptySide(): SideReport & { _sum: number; _n: number } {
  return { accuracy: 0, acpl: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, _sum: 0, _n: 0 };
}

/** Parse and validate a PGN; throws on invalid input. */
export function parsePgn(pgn: string): { san: string; color: 'w' | 'b' }[] {
  const game = new Chess();
  game.loadPgn(pgn); // throws if invalid
  const history = game.history({ verbose: true });
  if (history.length === 0) throw new Error('No moves found in this PGN.');
  return history.map((m) => ({ san: m.san, color: m.color as 'w' | 'b' }));
}

export function analyzeGame(pgn: string, depth = 2): GameReport {
  const moves = parsePgn(pgn);
  const replay = new Chess();
  const analyzed: AnalyzedMove[] = [];
  const white = emptySide();
  const black = emptySide();

  for (let i = 0; i < moves.length; i++) {
    const { san, color } = moves[i];
    const fenBefore = replay.fen();
    const scores = moveScores(fenBefore, depth);
    const best = scores.reduce((m, s) => Math.max(m, s.score), -Infinity);
    const played = scores.find((s) => s.san === san);
    const playedScore = played ? played.score : best;
    let cpLoss = Math.max(0, best - playedScore);
    if (cpLoss > 1000) cpLoss = 1000; // clamp mate-sized swings

    replay.move(san);
    const cls = classify(cpLoss);
    analyzed.push({ ply: i + 1, moveNo: Math.floor(i / 2) + 1, color, san, cpLoss, classification: cls, fenAfter: replay.fen() });

    const side = color === 'w' ? white : black;
    side._sum += cpLoss;
    side._n += 1;
    if (cls === 'Best') side.best++;
    else if (cls === 'Good') side.good++;
    else if (cls === 'Inaccuracy') side.inaccuracy++;
    else if (cls === 'Mistake') side.mistake++;
    else side.blunder++;
  }

  const finalize = (s: ReturnType<typeof emptySide>): SideReport => {
    const acpl = s._n ? Math.round(s._sum / s._n) : 0;
    const accuracy = Math.max(0, Math.min(100, Math.round(100 - acpl / 5)));
    return { accuracy, acpl, best: s.best, good: s.good, inaccuracy: s.inaccuracy, mistake: s.mistake, blunder: s.blunder };
  };

  let result = '*';
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    result = (g.header().Result as string) || (g.isCheckmate() ? (g.turn() === 'w' ? '0-1' : '1-0') : '*');
  } catch {
    // keep '*'
  }

  return { moves: analyzed, white: finalize(white), black: finalize(black), result };
}

export const SAMPLE_PGN =
  '[Event "Scholar\'s Mate demo"]\n[White "You"]\n[Black "Opponent"]\n[Result "1-0"]\n\n1. e4 e5 2. Bc4 Bc5 3. Qh5 Nf6 4. Qxf7# 1-0';
